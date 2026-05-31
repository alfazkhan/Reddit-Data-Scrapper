import { useState, useEffect } from "react";
import ServerStatus from "../ui/ServerStatus.jsx";
import Header from "../ui/Header";
import { Flex } from "@chakra-ui/react";
import UserInput from "../ui/UserInput.jsx";
import SubredditsSuggestions from "../ui/SubredditsSuggestion";
import DataTabs from "../ui/DataTabs";
import UpcomingFeatures from "../Feature Tracker/UpcomingFeatures";
import { Link } from "react-router-dom";

const BASE_URL = import.meta.env.PROD
  ? "https://api.theonlyalfaz.com"
  : "http://192.168.0.246:8000";

export default function Homepage() {
  const [posts, setPosts] = useState([]);
  const [processingStatus, setProcessingStatus] = useState(false);



  async function fetchSubredditData(subredditName, currentCount) {
    setProcessingStatus(true);
    const response = await fetch(
      `${BASE_URL}/posts/${subredditName}?limit=${currentCount}`,
    );
    const resData = await response.json();

    if (!response.ok) {
      throw new Error(resData.message || "Something went wrong!");
    } else {
      setProcessingStatus(false);
      setPosts(resData);
      console.log(resData);
    }
  }

  return (
    <Flex direction="column" justifyContent="center" width="80%" margin="auto">
      <Flex gap="4" align="anchor-center" justify="space-between" margin="5">
        <Header text={"Subreddit Analyzer"} highlight="Analyzer"/>
        <Link to="/dashboard">
          <ServerStatus />
        </Link>
      </Flex>

      <Flex justifyContent="center" gap="2" margin="5" flexDirection="column">
        <UserInput
          onFetchData={fetchSubredditData}
          processingStatus={processingStatus}
        />
        <SubredditsSuggestions />
      </Flex>

      {(posts.length !== 0 || processingStatus) && (
        <Flex justifyContent="center" gap="4" margin="5" flexDirection="column">
          <DataTabs postsData={posts} processingStatus={processingStatus} />
        </Flex>
      )}
      {import.meta.env.PROD && (
        <Flex justifyContent="center" gap="4" margin="5" flexDirection="column">
          <UpcomingFeatures />
        </Flex>
      )}
    </Flex>
  );
}
