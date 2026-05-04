import { Chart, useChart } from "@chakra-ui/charts";
import { useEffect, useMemo, useState } from "react";
import { LabelList, Pie, PieChart, Sector, Tooltip } from "recharts";

export default function KeywordsPieChart({ data }) {
  const [minValue, setMinValue] = useState(20);
  const [maxValue, setMaxValue] = useState(100);

  const keywordsCount = useMemo(() => {
    const counts = {};
    data.forEach((post) => {
      const keywords = post.keywords;
      if (!keywords) return;

      Object.keys(keywords).forEach((keyword) => {
        counts[keyword] === undefined
          ? (counts[keyword] = 1)
          : counts[keyword]++;
      });
    });

    return counts;
  }, [data]);

  let chartData = useMemo(() => {
    const data = [];
    Object.keys(keywordsCount).map((keyword) => {
      if (
        keywordsCount[keyword] >= minValue &&
        keywordsCount[keyword] < maxValue
      ) {
        data.push({
          name: keyword,
          value: keywordsCount[keyword],
          color: "blue.solid",
        });
      }
    });
    return data;
  }, [ keywordsCount, maxValue, minValue]);


  const chart = useChart({
    data: chartData,
  });

  return (
    <Chart.Root boxSize="320px" mx="auto" chart={chart}>
      <PieChart responsive>
        <Tooltip
          cursor={false}
          animationDuration={100}
          content={<Chart.Tooltip hideLabel />}
        />
        <Pie
          isAnimationActive={false}
          data={chart.data}
          dataKey={chart.key("value")}
          shape={(props) => (
            <Sector {...props} fill={chart.color(chart.key("color"))} />
          )}
        >
          <LabelList position="inside" fill="white" stroke="none" />
        </Pie>
      </PieChart>
    </Chart.Root>
  );
}
