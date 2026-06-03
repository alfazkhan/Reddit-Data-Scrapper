import DataPagination from "@/components/ui-components/DataPagination";
import DataTable from "@/components/ui-components/DataTable";
import { BASE_URL } from "@/Constants";
import { useEffect, useState } from "react";
import { Table } from "@chakra-ui/react";
import { useSelector } from "react-redux";

export default function UsersSection() {
  const [users, setUsers] = useState([]);
  const [dataSlice, setdataSlice] = useState([]);
    const authToken = useSelector((state) => state.authState.token);

  useEffect(() => {
    async function fetchIgnoredWords() {
      const response = await fetch(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Something went wrong!");
      } else {
        setUsers(resData);
      }
    }

    fetchIgnoredWords();
  }, [authToken]);

  return (
    <>
      <DataTable
        data={users}
        tableHeaders={[
          "ID",
          "Name",
          "Email",
          "Role",
          "API Calls Count",
          "API Calls limit",
        ]}
      >
        {dataSlice.map((user) => (
          <Table.Row key={user.id} textAlign="center" >
            <Table.Cell>{user.id}</Table.Cell>
            <Table.Cell>{user.name}</Table.Cell>
            <Table.Cell>{user.email}</Table.Cell>
            <Table.Cell>{user.role}</Table.Cell>
            <Table.Cell textAlign="center">{user.api_calls_count}</Table.Cell>
            <Table.Cell>{user.api_calls_limit === -1 ? "Unlimited" : user.api_calls_limit}</Table.Cell>
          </Table.Row>
        ))}
      </DataTable>
      <DataPagination data={users} setPaginationData={setdataSlice} />
    </>
  );
}
