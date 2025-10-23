import { useState } from "react";
import { Header, SortType } from "../Header";

export default function HeaderExample() {
  const [sortBy, setSortBy] = useState<SortType>("latest");
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <div>
      <Header
        isLoggedIn={isLoggedIn}
        user={{
          name: "김지수",
          profileImage: "https://i.pravatar.cc/150?img=1",
        }}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onWriteClick={() => console.log("Write clicked")}
        onLoginClick={() => {
          console.log("Login clicked");
          setIsLoggedIn(true);
        }}
        onLogoutClick={() => {
          console.log("Logout clicked");
          setIsLoggedIn(false);
        }}
        onMyPostsClick={() => console.log("My posts clicked")}
      />
    </div>
  );
}
