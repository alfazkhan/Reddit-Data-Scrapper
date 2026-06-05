import { Button, CloseButton, Dialog, HStack, Portal } from "@chakra-ui/react";

export default function DialogForm({ title, triggerText, children }) {
  return (
    <HStack wrap="wrap" gap="4">
      <Dialog.Root
        placement="center"
        motionPreset="slide-in-bottom"
        closeOnInteractOutside
        closeOnEscape
      >
        <Dialog.Trigger asChild>
          <Button
            variant="solid"
            backgroundColor="green.600"
            color="gray.100"
            fontWeight="bold"
          >
            {triggerText}
          </Button>
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title color="black">{title}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body color="gray.900">
                {children}
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button
                    variant="outline"
                    color="red.700"
                    borderColor="red.700"
                  >
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button variant="solid" backgroundColor="green.600">
                  Save
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </HStack>
  );
}
