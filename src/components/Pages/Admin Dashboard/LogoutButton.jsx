import { useDispatch, useSelector } from "react-redux";
import { authSliceActions } from "@/store/authSlice";
import { Button, Text, Flex } from "@chakra-ui/react";
import { signOut } from "firebase/auth";
import { auth } from "../../../../firebase_config";

export default function LogoutButton() {
  const isAuthenticated = useSelector(
    (state) => state.authState.isAuthenticated,
  );

  const user = useSelector((state) => state.authState.user);

  const dispatch = useDispatch();
  const logoutAction = authSliceActions.logoutUser;

  async function logoutHandler() {
    try {
      await signOut(auth);
      dispatch(logoutAction());
      console.log("Successfully logged out of Firebase and Redux.");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  return (
    <>
      {isAuthenticated && (
        <Flex alignItems="center" gap={5}>
          <Text>
            Hello, <strong>{user.name}</strong>
          </Text>
          <Button
            size="xs"
            color="white"
            fontWeight="black"
            bg="red.500"
            onClick={logoutHandler}
          >
            Logout
          </Button>
        </Flex>
      )}
    </>
  );
}
