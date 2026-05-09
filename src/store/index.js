import {configureStore} from "@reduxjs/toolkit"
import userInput from "./userInput"
import serverStatus from "./serverStatus"



const store = configureStore({
    reducer: {
        userInputState: userInput, serverStatusState: serverStatus
    }
})

export default store