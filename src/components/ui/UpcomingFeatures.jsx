import { List, Text } from "@chakra-ui/react";
import { LuCircleDashed, LuCircleCheck } from "react-icons/lu";
import { FaReact, FaPython  } from "react-icons/fa";

const UPCOMING_FEATURES = [
  {
    type: "FRONTEND",
    description: "Add use cache only button",
    status: "COMPLETED",
  },
  {
    type: "BACKEND",
    description: "Advanced Emotions detector",
    status: "IN_PROGRESS",
  },
  {
    type: "FRONTEND",
    description: "Pie Chart of different keywords",
    status: "IN_PROGRESS",
  },
  {
    type: "FRONTEND",
    description: "Posts Table filtered by words",
    status: "IN_PROGRESS",
  },
  {
    type: "FRONTEND",
    description: "Posts Table filtered by Emotions",
    status: "IN_PROGRESS",
  },
  {
    type: "FRONTEND",
    description: "Keyword Table",
    status: "IN_PROGRESS",
  },
  {
    type: "BACKEND",
    description:
      "Chart showing Different emotions at different times of the day",
    status: "IN_PROGRESS",
  },
  {
    type: "BACKEND",
    description: "Segregation of posts based on topics",
    status: "IN_PROGRESS",
  },
];

export default function UpcomingFeatures() {
  return (
    <>
      <Text
        fontSize="2xl"
        fontWeight="bolder"
        color="orange.600"
        textDecoration="underline"
      >
        Upcoming Features
      </Text>
      {UPCOMING_FEATURES.map((feature) => (
        <List.Root
          gap="0"
          variant="plain"
          align="center"
          key={feature.description}
        >
          <List.Item>
              {feature.type === "FRONTEND" ? <FaReact/> : <FaPython />}
            <List.Indicator asChild color="green.500">
              {feature.status === "COMPLETED" ? <LuCircleCheck /> : <LuCircleDashed />}
            </List.Indicator>
            {feature.description}
          </List.Item>
        </List.Root>
      ))}
    </>
  );
}
