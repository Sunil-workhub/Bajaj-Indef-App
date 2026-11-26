import React from "react";
import { FlatList, View } from "react-native";
import TableRow from "./TableRow";

type Props = {
  headers: string[];
  data: string[][];
  totalRow?: string[];
};

const TableList = ({ headers, data, totalRow }: Props) => {
  return (
    <View>
      <TableRow columns={headers} isHeader />

      <FlatList
        data={data}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => <TableRow columns={item} />}
      />

      {totalRow && <TableRow columns={totalRow} isTotal />}
    </View>
  );
};

export default TableList;
