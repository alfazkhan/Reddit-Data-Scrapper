import { Badge } from "@chakra-ui/react";
import { memo } from "react";
import { CgShapeCircle } from "react-icons/cg";

function ServerStatus({ status }) {
  

  return (
    <>
      <Badge
        variant={status === "online" ? "solid" : "surface"}
        colorPalette={status === "online" ? "green" : "red"}
        size="lg"
      >
        <CgShapeCircle color={status === "online" ? "green.500" : "red.500"} />
        {status.toUpperCase()}
      </Badge>
    </>
  );
}

export default memo(ServerStatus)
