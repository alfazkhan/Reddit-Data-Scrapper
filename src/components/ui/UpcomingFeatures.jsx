import {
  Box,
  HStack,
  VStack,
  Text,
  Heading,
  Card,
  Badge,
  Stack,
  Collapsible,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Papa from "papaparse";
import { LuChevronRight } from "react-icons/lu";

// 1. Define your "Source of Truth" for columns
const DEFAULT_COLUMNS = [
  "Pending",
  "In Progress",
  "Testing",
  "Bug Fixes",
  "Completed",
  "Deployed",
];

export default function UpcomingFeatures() {
  // 2. Initialize state with empty columns immediately
  const [boardData, setBoardData] = useState(
    DEFAULT_COLUMNS.map((title) => ({ id: title, title, cards: [] })),
  );

  useEffect(() => {
    async function parseData() {
      try {
        const response = await fetch("./Tasks.csv");
        if (!response.ok) return; // Keep empty tables if file fails

        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            // 3. Start with the default empty structure
            const newBoard = DEFAULT_COLUMNS.map((title) => ({
              id: title,
              title,
              cards: [],
            }));

            // 4. Fill the columns with CSV data
            result.data.forEach((task) => {
              const column = newBoard.find((col) => col.title === task.Status);
              if (column) {
                column.cards.push({
                  id: Math.random().toString(),
                  title: task.Task,
                  type: task.Type,
                });
              }
            });

            setBoardData(newBoard);
          },
        });
      } catch (error) {
        console.error("CSV Error:", error);
      }
    }

    parseData();
  }, []);

  return (
    <Collapsible.Root>
      <Collapsible.Trigger paddingY="3" display="flex" gap={2} alignItems="center">
      <Collapsible.Indicator
        transition="transform 0.2s"
        _open={{ transform: "rotate(90deg)" }}
        color="orange.600"
      >
        <LuChevronRight />
      </Collapsible.Indicator>
      <Heading size="lg" color="orange.600">Upcoming Features</Heading>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Box
          width="full"
          height="80vh"
          overflowX="auto"
          p="5"
          bg="blackAlpha.50"
          borderRadius="xl"
          css={{
            "&::-webkit-scrollbar": {
              display: "none",
            },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          <HStack alignItems="flex-start" gap="6" height="full">
            {boardData.map((list) => (
              <VStack
                key={list.id}
                width="1/3"
                flex="0 0 250px"
                bg="whiteAlpha.100"
                p="4"
                borderRadius="lg"
                alignItems="stretch"
                maxHeight="full"
                minH="200px"
              >
                <Heading size="sm" mb="4" color="orange.500">
                  {list.title}
                </Heading>

                <Stack
                  gap="4"
                  css={{
                    "&::-webkit-scrollbar": {
                      display: "none",
                    },
                    msOverflowStyle: "none",
                    scrollbarWidth: "none",
                  }}
                >
                  {list.cards.length > 0 ? (
                    list.cards.map((item) => (
                      <Card.Root key={item.id} variant="outline" bg="gray.900">
                        <Card.Body p="4">
                          <Badge
                            colorPalette={
                              item.type === "Frontend" ? "blue" : "yellow"
                            }
                            mb="2"
                          >
                            {item.type === "Frontend" ? "React" : "Python"}
                          </Badge>
                          <Text fontWeight="medium" color="white">
                            {item.title}
                          </Text>
                        </Card.Body>
                      </Card.Root>
                    ))
                  ) : (
                    // 5. Visual feedback for empty columns
                    <Text
                      fontSize="xs"
                      color="whiteAlpha.400"
                      textAlign="center"
                      py="10"
                      borderStyle="dashed"
                      borderWidth="1px"
                      borderRadius="md"
                    >
                      Nothing in "{list.title}""
                    </Text>
                  )}
                </Stack>
              </VStack>
            ))}
          </HStack>
        </Box>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
