import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import {
  checkDeviceAccess,
  getMenuAccess,
  loginUser,
} from "../api/authService";
import { MenuAccessItem, OrgAccessItem } from "../api/types";
import { apiMessage, unwrapApi } from "../utils/apiResponse";
import { getDeviceMeta } from "../utils/deviceId";

type AuthResult = {
  userId: number;
  email: string;
  orgAccess: OrgAccessItem[];
};

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  email: string | null;
  userId: number | null;
  menuAccess: MenuAccessItem[];
  menuLoading: boolean;
  orgAccess: OrgAccessItem[];
  selectedOrg: OrgAccessItem | null;
  needsOrgSelection: boolean;
  hasAccess: (key: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  selectOrg: (org: OrgAccessItem) => void;
  recheckDevice: () => Promise<void>;
  // Add to AuthState interface
  changeOrg: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [menuAccess, setMenuAccess] = useState<MenuAccessItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [orgAccess, setOrgAccess] = useState<OrgAccessItem[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgAccessItem | null>(null);

  const selectedOrgRef = useRef<OrgAccessItem | null>(null);
  const checkingRef = useRef(false);
  const authenticatedRef = useRef(false);
  const sessionVersion = useRef(0);
  const mountedRef = useRef(true);

  const needsOrgSelection =
    status === "authenticated" && orgAccess.length > 1 && !selectedOrg;

  // const changeOrg = () => {
  //   setMenuAccess([]);
  //   setSelectedOrg(null);
  // };

  const changeOrg = useCallback(() => {
    // Clear the selected organization reference
    selectedOrgRef.current = null;

    // Clear previous organization's menu permissions
    setMenuAccess([]);
    setMenuLoading(false);

    // Reset organization selection
    setSelectedOrg(null);
  }, []);

  const clearSession = useCallback(() => {
    sessionVersion.current += 1;
    selectedOrgRef.current = null;
    setEmail(null);
    setUserId(null);
    setMenuAccess([]);
    setMenuLoading(false);
    setOrgAccess([]);
    setSelectedOrg(null);
    authenticatedRef.current = false;
    setStatus("unauthenticated");
  }, []);

  const applyAuthResult = useCallback((result: AuthResult) => {
    if (
      !result ||
      !result.userId ||
      !result.email ||
      !Array.isArray(result.orgAccess)
    ) {
      throw new Error("Invalid authentication response from server.");
    }

    const orgs = result.orgAccess;
    const previous = selectedOrgRef.current;
    const nextOrg =
      orgs.length === 1
        ? orgs[0]
        : (orgs.find((org) => org.orgId === previous?.orgId) ?? null);

    // Use a fresh org object on every successful recheck so menu permissions reload.
    selectedOrgRef.current = nextOrg;
    setUserId(result.userId);
    setEmail(result.email);
    setOrgAccess(orgs);
    setSelectedOrg(nextOrg);
    authenticatedRef.current = true;
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !userId || !selectedOrg) {
      setMenuAccess([]);
      setMenuLoading(false);
      return;
    }

    let cancelled = false;
    const version = sessionVersion.current;
    setMenuLoading(true);
    // Do not show stale permissions while fetching new ones.
    setMenuAccess([]);

    getMenuAccess(userId, selectedOrg.orgId)
      .then((response) => {
        const result = unwrapApi<{ menuAccess?: MenuAccessItem[] }>(response);
        if (!cancelled && version === sessionVersion.current) {
          setMenuAccess(
            Array.isArray(result?.menuAccess) ? result.menuAccess : [],
          );
        }
      })
      .catch((error) => {
        console.error(
          "Menu access refresh failed:",
          apiMessage(error, "Menu access unavailable"),
        );
        if (!cancelled && version === sessionVersion.current) setMenuAccess([]);
      })
      .finally(() => {
        if (!cancelled && version === sessionVersion.current)
          setMenuLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, userId, selectedOrg]);

  const recheckDeviceInternal = useCallback(
    async (showChecking: boolean) => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      if (showChecking) setStatus("checking");

      try {
        const meta = await getDeviceMeta();
        const response = await checkDeviceAccess(meta.deviceId);
        const result = unwrapApi<AuthResult>(response);
        if (mountedRef.current) applyAuthResult(result);
      } catch (error: any) {
        console.error(
          "Device validation failed:",
          apiMessage(error, "Device validation failed"),
        );
        const httpStatus = error?.response?.status ?? error?.httpStatus;
        // A definitive 401/403 means device access is revoked. Other failures
        // (network/timeout/server errors) should not log out an existing session.
        const rejected =
          httpStatus === 401 ||
          httpStatus === 403 ||
          error?.status_Code === 401 ||
          error?.status_Code === 403;
        if (mountedRef.current && (rejected || !authenticatedRef.current))
          clearSession();
      } finally {
        checkingRef.current = false;
      }
    },
    [applyAuthResult, clearSession],
  );

  const recheckDevice = useCallback(async () => {
    await recheckDeviceInternal(false);
  }, [recheckDeviceInternal]);

  useEffect(() => {
    mountedRef.current = true;
    void recheckDeviceInternal(true);
    let previous: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener("change", (next) => {
      if (
        (previous === "background" || previous === "inactive") &&
        next === "active"
      ) {
        void recheckDeviceInternal(false);
      }
      previous = next;
    });
    return () => {
      mountedRef.current = false;
      subscription.remove();
    };
  }, [recheckDeviceInternal]);

  const login = async (loginEmail: string, password: string) => {
    try {
      const { deviceId, platform, deviceLabel } = await getDeviceMeta();
      const response = await loginUser({
        email: loginEmail,
        password,
        deviceId,
        platform,
        deviceLabel,
      });
      const result = unwrapApi<AuthResult>(response);
      applyAuthResult(result);
    } catch (error: any) {
      throw new Error(apiMessage(error, "Unable to log in. Please try again."));
    }
  };

  const selectOrg = (org: OrgAccessItem) => {
    if (!orgAccess.some((item) => item.orgId === org.orgId)) return;
    selectedOrgRef.current = org;
    setSelectedOrg(org);
  };

  const hasAccess = (key: string) =>
    status === "authenticated" &&
    !!selectedOrg &&
    menuAccess.some((item) => item.key === key);

  return (
    <AuthContext.Provider
      value={{
        status,
        email,
        userId,
        menuAccess,
        menuLoading,
        orgAccess,
        selectedOrg,
        needsOrgSelection,
        hasAccess,
        login,
        selectOrg,
        changeOrg, // Add here
        recheckDevice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
