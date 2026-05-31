import Header from "../ui/Header";
import ReanalyzeSection from "../ui/ReanalyzeSection";
import { Flex, Tabs } from "@chakra-ui/react";

export default function AdminDashboard() {
  return (
    <Flex direction="column" justifyContent="center" width="80%" margin="auto">
      <Header text="Admin Dashboard" highlight="Dashboard" />
      <Tabs.Root
        variant="subtle"
        defaultValue="members"
        orientation="vertical"
        css={{
          "--tabs-indicator-bg": "colors.gray.subtle",
          "--tabs-indicator-shadow": "shadows.xs",
          "--tabs-trigger-radius": "radii.full",
          
        }}
      >
        <Tabs.List >
          <Tabs.Trigger value="tasks">Subreddits</Tabs.Trigger>
          <Tabs.Trigger value="projects">Ignored Words</Tabs.Trigger>
          <Tabs.Trigger value="members">Reanalyze Data</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="tasks">
          Manage your tasks and their progress here.
        </Tabs.Content>
        <Tabs.Content value="projects">
          Manage your projects and their status here.
        </Tabs.Content>

        <Tabs.Content value="members">
          <ReanalyzeSection />;
        </Tabs.Content>
      </Tabs.Root>
    </Flex>
  );
}
