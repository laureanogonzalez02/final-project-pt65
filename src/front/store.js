export const initialStore = {
  staffList: [],
  singleUser: null,
  message: null,
  todos: [],
  token: localStorage.getItem("token") || null,
  user: JSON.parse(localStorage.getItem("user")) || null,
  appointments: [],
};

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case "login":
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      return {
        ...store,
        token: action.payload.token,
        user: action.payload.user,
      };

    case "logout":
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return {
        ...store,
        token: null,
        user: null,
      };

    case "set_staff_list":
      return { ...store, staffList: action.payload };

    case "set_user":
      return {
        ...store,
        singleUser: action.payload
      };

    case "set_hello":
      return { ...store, message: action.payload };

    case "add_task":
      const { id, color } = action.payload;
      return {
        ...store,
        todos: store.todos.map((todo) =>
          todo.id === id ? { ...todo, background: color } : todo,
        ),
      };
    case "set_appointments":
      return{
        ...store,
        appointments: action.payload
      };

    default:
      return store;
  }
}
