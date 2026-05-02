import { List } from "@chakra-ui/react";
import { LuCircleDashed } from "react-icons/lu";

const UPCOMING_FEATURES = [
  "Add use cache only button",
  "Advanced Emotions detector",
  "Pie Chart of different keywords",
  "Posts Table filtered by words",
  "Posts Table filtered by Emotions",
  "Keyword Table",
  "Chart showing Different emotions at different times of the day",
  "Segregation of posts based on topics"
];

export default function UpcomingFeatures() {
  return (
    <>
      {UPCOMING_FEATURES.map((feature) => (
        <List.Root gap="2" variant="plain" align="center" key={feature}>
          <List.Item>
            <List.Indicator asChild color="green.500">
              <LuCircleDashed />
            </List.Indicator>
            {feature}
          </List.Item>
        </List.Root>
      ))}
    </>
  );
}
