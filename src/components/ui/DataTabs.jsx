import { Tabs } from "@chakra-ui/react";
import { LuFolder, LuSquareCheck, LuUser } from "react-icons/lu";
import KeywordTable from "../Data/KeywordTable";
import Sentiment from "../Data/Sentiment";
import PieChart from "../Data/PieChart";

export default function DataTabs() {
  const TabsListData = [
    { value: "Sentiments", icon: LuFolder, content: <Sentiment/> },
    { value: "Pie Chart", icon: LuSquareCheck, content: "Coming Soon" },
    { value: "Posts Table", icon: LuUser, content: "Coming Soon" },
    { value: "Keyword Table", icon: LuUser, content: "Coming Soon" },
  ];

  return (
    <Tabs.Root
      defaultValue="Sentiments"
      variant="plain"
    //   lazyMount
    //   unmountOnExit
      width="auto"
      fitted
      css={{
        "--tabs-indicator-bg": "colors.orange.600",
        "--tabs-indicator-color": "colors.orange.600",
      }}
    >
      <Tabs.List rounded="l3" p="1">
        {TabsListData.map((tab) => (
          <Tabs.Trigger
            key={tab.value} // Always add a key
            value={tab.value}
            color="white"
            fontWeight="bold"
            _selected={{ bgColor: "orange.600" }}
          >
            <tab.icon />
            {tab.value}
          </Tabs.Trigger>
        ))}
        <Tabs.Indicator rounded="l2" />
      </Tabs.List>

      {TabsListData.map((tab) => (
        <Tabs.Content key={tab.value} value={tab.value}>
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
