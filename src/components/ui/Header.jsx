import { Heading, Highlight } from "@chakra-ui/react";

export default function Header() {
  return (
    <Heading size="5xl">
      <Highlight query="Scrapper" styles={{ color: "orange.600" }}>
      Subreddit Scrapper
      </Highlight>
    </Heading>
  );
}
