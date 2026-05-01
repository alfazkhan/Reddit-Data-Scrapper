import { createContext } from "react";
import { useReducer } from "react";

const initialState = {
  subredditName: "AskIndianWomen",
  targetPostCount: 100,
};

function SubredditReducer(prevState, action) {
  switch(action.type){
    case "NAME_CHANGE": return {...prevState, subredditName: action.payload};
    case "COUNT_CHANGE": return {...prevState, targetPostCount: action.payload};
  }
}

export const SubredditContext = createContext({
  subredditName: "",
  targetPostCount: 0,
  handleNameChange: () => {},
  handleCountChange: () => {},
});

export default function SubredditContextProvider({children}) {
  const [state, dispatch] = useReducer(SubredditReducer, initialState);

  function handleNameChange(newName) {
    dispatch({
        type: "NAME_CHANGE",
        payload: newName
    })
  }

  function handleCountChange(newCount) {
    dispatch({
        type: "COUNT_CHANGE",
        payload: newCount
    })
  }

  const ctxValue = {
    subredditName: state.subredditName,
    targetPostCount: state.targetPostCount,
    handleNameChange, handleCountChange
  };

  return <SubredditContext.Provider value={ctxValue}>{children}</SubredditContext.Provider>
}
