import {
  Input,
  InputGroup,
  Field,
  NumberInput,
  HStack,
  Button,
} from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { SubredditContext } from "../../store/SubredditContext.jsx";

export default function UserInput({ onStart }) {
  const {
    subredditName: subreddit,
    targetPostCount: targetCount,
    handleNameChange,
    handleCountChange,
  } = useContext(SubredditContext);

  const [subredditName, setSubredditName] = useState(subreddit);
  const [postCount, setPostCount] = useState(targetCount);

  useEffect(() => {
    setSubredditName(subreddit);
  }, [subreddit]);

  function OnScrapeHandler() {
    handleNameChange(subredditName);
    handleCountChange(postCount);
    onStart()
  }

  return (
    <HStack width="full" gap="1" justifyContent="center" alignItems="center">
      <Field.Root required flex={1}>
        <Field.Label>
          Subreddit Name <Field.RequiredIndicator />
        </Field.Label>
        <InputGroup
          startElement="reddit.com/r/"
          startElementProps={{ color: "fg.subtle" }}
        >
          <Input
            ps="12ch"
            value={subredditName}
            placeholder={"AskIndianWomen"}
            width="full"
            onChange={(e) => setSubredditName(e.target.value)}
          />
        </InputGroup>
        <Field.HelperText>
          Enter Subreddit name or choose from the suggestions below
        </Field.HelperText>
      </Field.Root>
      <HStack>
        <Field.Root required>
          <Field.Label>
            Post Count <Field.RequiredIndicator />
          </Field.Label>
          <NumberInput.Root
            defaultValue={postCount}
            width="full"
            allowMouseWheel
          >
            <NumberInput.Control />
            <NumberInput.Input onChange={(e) => setPostCount(e.target.value)} />
          </NumberInput.Root>
          <Field.HelperText>
            Enter Number of Posts to be scrapped
          </Field.HelperText>
        </Field.Root>
        <Button
          size="sm"
          color="white"
          fontWeight="black"
          bg="orange.600"
          onClick={OnScrapeHandler}
        >
          Start Scrapping
        </Button>
      </HStack>
    </HStack>
  );
}
