import { Button, HStack, VStack, Text } from "@chakra-ui/react";
import { useContext } from "react";
import { SubredditContext } from "../../store/SubredditContext.jsx";

const Suggestions = [
  { name: "r/India", link: "India" },
  { name: "r/Mumbai", link: "Mumbai" },
  { name: "r/Munich", link: "Munich" },
  { name: "r/AskIndianWomen", link: "AskIndianWomen" },
  { name: "r/BoycottIsrael", link: "BoycottIsrael" },
  { name: "r/LegalAdviceIndia", link: "LegalAdviceIndia" },
];

function dateTimeFormatter(rawTimestamp) {
  const date = new Date(rawTimestamp);
  const formattedDate = date
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", "")
    .toUpperCase();

  return formattedDate;
}

export default function SubredditsSuggestions({ cacheSummary }) {
  const { handleNameChange, handleCountChange } = useContext(SubredditContext);

  return (
    <HStack>
      {Suggestions.map((sub) => (
        <VStack key={sub.name + "stack"} gap="-1.5">
          <Button
            key={sub.name}
            size="xs"
            color="white"
            fontWeight="black"
            bg="orange.600"
            onClick={() => {
              handleNameChange(sub.link);
              handleCountChange(cacheSummary[sub.link]?.count)
            }}
            marginBottom={2}
          >
            {sub.name}
          </Button>
          <Text
            key={`${sub.name}-count`}
            color="green.400"
            fontSize="xx-small"
            textAlign="left"
          >
            Cached Posts: {cacheSummary[sub.link]?.count}
          </Text>
          <Text
            key={`${sub.name}-last-updated`}
            fontSize="xx-small"
            textAlign="left"
          >
            Last Scrapped post:
          </Text>
          <Text
            key={`${sub.name}-datetime`}
            color="green.400"
            fontSize="xx-small"
            textAlign="left"
          >
            {dateTimeFormatter(cacheSummary[sub.link]?.last_updated)}
          </Text>
        </VStack>
      ))}
    </HStack>
  );
}
