import { useEffect, useState } from "react";
import { BASE_URL } from "../../../Constants.js";
import {
  Table,
  Switch,
  Checkbox,
  Checkmark,
  Badge,
  Button,
} from "@chakra-ui/react";
import DataPagination from "@/components/ui-components/DataPagination.jsx";
import DataTable from "@/components/ui-components/DataTable.jsx";
import EditableInput from "@/components/ui-components/EditableInput.jsx";
import { useSelector } from "react-redux";

export default function IgnoredWordsSection() {
  const [words, setWords] = useState([]);
  const [dataSlice, setdataSlice] = useState([]);
  const [loading, setLoading] = useState(false);

  const authToken = useSelector((state) => state.authState.token);

  useEffect(() => {
    async function fetchIgnoredWords() {
      const response = await fetch(BASE_URL + "/ignored-words");
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Something went wrong!");
      } else {
        setWords(resData);
      }
    }

    fetchIgnoredWords();
  }, []);

  async function ignoredWordApprovalHandler(word, payload) {
    // console.log(action, word, payload);
    setLoading(true);
    const update = JSON.stringify({
      approved: payload,
    });

    try {
      const response = await fetch(`${BASE_URL}/ignored-words/${word.word}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: update,
      });
      const res = await response.json();
      const updatedWords = [...words];
      const wordIndex = updatedWords.findIndex((w) => w.id === word.id);
      updatedWords[wordIndex].approved = payload;
      setWords(updatedWords);
      setLoading(false)
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <DataTable
        data={words}
        tableHeaders={["ID", "Word", "Language", "Processed", "Approved"]}
      >
        {dataSlice.map((word) => (
          <Table.Row key={word.id} textAlign="center">
            <Table.Cell>{word.id}</Table.Cell>
            <Table.Cell>{word.word}</Table.Cell>
            <Table.Cell>
              <EditableInput fieldValue={word.language} />
            </Table.Cell>
            {/* <Table.Cell>{word.language}</Table.Cell> */}
            <Table.Cell textAlign="center">
              {/* <Checkmark
                checked={word.processed}
                variant="solid"
                colorPalette="green"
              /> */}
              <Badge
                variant="subtle"
                colorPalette={word.processed ? "green" : "gray"}
              >
                {word.processed ? "Processed" : "Not Processed"}
              </Badge>
            </Table.Cell>
            <Table.Cell textAlign="center">
              {/* <Checkbox.Root
                checked={word.approved}
                variant="solid"
                colorPalette="green"
                onCheckedChange={(e) =>
                  ignoredWordApprovalHandler(word, e.checked)
                }
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
              </Checkbox.Root> */}
              <Button
                colorPalette={!word.approved ? "green" : "red"}
                variant="solid"
                size="2xs"
                disabled={loading}
                onClick={() => ignoredWordApprovalHandler(word, !word.approved)}
              >
                {!word.approved ? "Approve" : "Dis-Approve"}
              </Button>
            </Table.Cell>
          </Table.Row>
        ))}
      </DataTable>
      <DataPagination data={words} setPaginationData={setdataSlice} />
    </>
  );
}
