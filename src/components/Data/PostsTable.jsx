import {
  HStack,
  Table,
  Field,
  NumberInput,
  Flex,
  Pagination,
  ButtonGroup,
  IconButton,
  Text,
  Collapsible,
  Stack,
  Button,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { LuChevronDown } from "react-icons/lu";

const config = [
  { emoji: "", color: "#009637", label: "All" },
  { emoji: "😊", color: "#009637", label: "Positive" },
  { emoji: "😐", color: "#52719c", label: "Neutral" },
  { emoji: "😠", color: "#aa0505", label: "Negative" },
];

function timeStampFormatter(time) {
  const formattedDate = time.split("T")[0] + " ";
  const formattedTime =
    time.split("T")[1].split(":")[0] + ":" + time.split("T")[1].split(":")[1];

  return (
    <span>
      <p>{formattedDate}</p> {formattedTime}{" "}
    </span>
  );
}

export default function KeywordTable({ data: postsData }) {
  const [sentiment, setSentiment] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  let data = postsData;

  if (sentiment !== "All") {
    data = postsData.filter((post) => post.sentiment === sentiment);
  }

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, currentPage]);

  return (
    <Flex direction="column">
      <HStack
        width="full"
        justifyContent="space-around"
        gap="4"
        mb={4}
        borderWidth="0.1px"
        padding={3}
        borderColor="gray.700"
      >
        <Text fontSize="lg" fontWeight="bold">
          Filter Posts By
        </Text>
        {config.map((emotion) => (
          <Flex
            key={emotion.label}
            alignItems="center"
            borderRadius="xs"
            padding={2}
            cursor="pointer"
            backgroundColor={
              emotion.label === sentiment ? "orange.600" : "gray.800"
            }
            _hover={{ bg: "whiteAlpha.100" }}
            onClick={() => setSentiment(emotion.label)}
          >
            <Text>{emotion.emoji}</Text>
            <Text fontWeight="bold" color="white">
              {emotion.label}
            </Text>
          </Flex>
        ))}
      </HStack>
      <Table.ScrollArea
        h="500px"
        borderWidth="1px"
        rounded="md"
        borderColor="gray.700"
      >
        <Table.Root variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader color="orange.600" fontWeight="extrabold">
                ID
              </Table.ColumnHeader>
              <Table.ColumnHeader color="orange.600" fontWeight="extrabold">
                Title
              </Table.ColumnHeader>
              <Table.ColumnHeader color="orange.600" fontWeight="extrabold">
                Post
              </Table.ColumnHeader>
              <Table.ColumnHeader color="orange.600" fontWeight="extrabold">
                Timestamp
              </Table.ColumnHeader>
              <Table.ColumnHeader color="orange.600" fontWeight="extrabold">
                Sentiment
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {paginatedData.map((post) => (
              <Table.Row key={post.id} color="gray.100">
                <Table.Cell
                  maxW="100px"
                  whiteSpace="normal"
                  verticalAlign="top"
                >
                  {post.id}
                </Table.Cell>
                <Table.Cell
                  maxW="200px"
                  whiteSpace="normal"
                  verticalAlign="top"
                >
                  {post.title}
                </Table.Cell>
                <Table.Cell
                  maxW="300px"
                  whiteSpace="normal"
                  verticalAlign="top"
                >
                  <Collapsible.Root collapsedHeight="80px">
                    <Collapsible.Content>
                      <Stack>{post.body? post.body : <Text color="red.400" textAlign="center">No body content</Text>}</Stack>
                    </Collapsible.Content>
                    {post.body.length >= 300 && (
                      <Collapsible.Trigger asChild mt="3">
                        <Button
                          variant="solid"
                          size="xs"
                          fontSize="x-small"
                          color="gray.400"
                          padding={1}
                          borderColor="gray.200"
                        >
                          <Collapsible.Context>
                            {(api) => (api.open ? "Show Less" : "Show More")}
                          </Collapsible.Context>
                          <Collapsible.Indicator
                            transition="transform 0.2s"
                            _open={{ transform: "rotate(180deg)" }}
                          >
                            <LuChevronDown />
                          </Collapsible.Indicator>
                        </Button>
                      </Collapsible.Trigger>
                    )}
                  </Collapsible.Root>
                </Table.Cell>
                <Table.Cell>{timeStampFormatter(post.timestamp)}</Table.Cell>
                <Table.Cell
                  color={
                    config.find((element) => post.sentiment === element.label)
                      .color
                  }
                >
                  {post.sentiment}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      <Pagination.Root
        count={data.length}
        pageSize={pageSize}
        page={currentPage}
        onPageChange={(details) => setCurrentPage(details.page)}
      >
        <ButtonGroup variant="ghost" size="sm" wrap="wrap" mt={3}>
          <Pagination.PrevTrigger asChild color="gray.100">
            <IconButton>
              <LuChevronLeft />
            </IconButton>
          </Pagination.PrevTrigger>

          <Pagination.Items
            render={(page) => (
              <IconButton
                variant={{ base: "ghost", _selected: "outline" }}
                color="gray.100"
              >
                {page.value}
              </IconButton>
            )}
          />

          <Pagination.NextTrigger asChild color="gray.100">
            <IconButton>
              <LuChevronRight />
            </IconButton>
          </Pagination.NextTrigger>
        </ButtonGroup>
      </Pagination.Root>
    </Flex>
  );
}
