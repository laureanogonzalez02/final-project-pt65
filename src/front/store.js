export const initialStore = {
  staffList: [],
  message: null,
  todos: [],
};

export default function storeReducer(store, action = {}) {
  switch (action.type) {

    case "set_staff_list":
      return {
        ...store,
        staffList: action.payload,
      };

    case "set_hello":
      return {
        ...store,
        message: action.payload,
      };

    case "add_task":
      const { id, color } = action.payload;

      return {
        ...store,
        todos: store.todos.map((todo) =>
          todo.id === id ? { ...todo, background: color } : todo,
        ),
      };

    default:
      return store;
  }
}
