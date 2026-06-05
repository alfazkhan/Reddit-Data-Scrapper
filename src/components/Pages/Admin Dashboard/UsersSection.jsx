import DataPagination from "@/components/ui-components/DataPagination";
import DataTable from "@/components/ui-components/DataTable";
import { BASE_URL } from "@/Constants";
import { useEffect, useState } from "react";
import {
  Table,
  Flex,
  Field,
  Input,
  Fieldset,
  Stack,
  NativeSelect,
  For,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import DialogForm from "@/components/ui-components/DialogForm";

export default function UsersSection() {
  const [users, setUsers] = useState([]);
  const [dataSlice, setdataSlice] = useState([]);
  const authState = useSelector((state) => state.authState);

  useEffect(() => {
    async function fetchIgnoredWords() {
      const response = await fetch(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${authState.token}` },
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Something went wrong!");
      } else {
        setUsers(resData);
      }
    }

    fetchIgnoredWords();
  }, [authState]);

  return (
    <>
      <Flex direction="column" gap="8" my="3">
        <Flex justify="flex-end">
          {authState.role === "Super Admin" && (
            <DialogForm title="Create New User" triggerText="Create New User">
              <NewUser />
            </DialogForm>
          )}
        </Flex>
      </Flex>
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
          <Table.Row key={user.id} textAlign="center">
            <Table.Cell>{user.id}</Table.Cell>
            <Table.Cell>{user.name}</Table.Cell>
            <Table.Cell>{user.email}</Table.Cell>
            <Table.Cell>{user.role}</Table.Cell>
            <Table.Cell>{user.api_calls_count}</Table.Cell>
            <Table.Cell>
              {user.api_calls_limit === -1 ? "Unlimited" : user.api_calls_limit}
            </Table.Cell>
          </Table.Row>
        ))}
      </DataTable>
      <DataPagination data={users} setPaginationData={setdataSlice} />
    </>
  );
}

function NewUser() {
  const [values, setValues] = useState({
    email: "user@example.com",
    password: "StrongPassword123!",
    name: "Full Name",
    role: "Guest",
    api_calls_limit: 1000,
  });

  return (
    <Fieldset.Root size="lg" maxW="md">
      <Fieldset.Content>
        <Field.Root>
          <Field.Label>Name</Field.Label>
          <Input value={values.name} name="name" />
        </Field.Root>

        <Field.Root>
          <Field.Label>Email address</Field.Label>
          <Input value={values.email} name="email" type="email" />
        </Field.Root>

        <Field.Root>
          <Field.Label>Password</Field.Label>
          <Input value={values.password} name="password" type="password" />
        </Field.Root>

        <Field.Root>
          <Field.Label>Role</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field name="role" value={[values.role]}>
              <For each={["Super Admin", "Admin", "Guest", "Developer"]}>
                {(item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                )}
              </For>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root>
          <Field.Label>API calls limit</Field.Label>
          <Input
            value={values.api_calls_limit}
            name="api_calls_limit"
            type="number"
          />
        </Field.Root>
      </Fieldset.Content>
    </Fieldset.Root>
  );
}
