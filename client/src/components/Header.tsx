import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PenSquare, LogOut, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export type SortType = "latest" | "popular";

export interface HeaderProps {
  isLoggedIn?: boolean;
  user?: {
    name: string;
    profileImage?: string;
  };
  sortBy: SortType;
  onSortChange: (sort: SortType) => void;
  onWriteClick: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onMyPostsClick: () => void;
}

export function Header({
  isLoggedIn = false,
  user,
  sortBy,
  onSortChange,
  onWriteClick,
  onLoginClick,
  onLogoutClick,
  onMyPostsClick,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold" data-testid="text-app-title">결과물 제출</h1>
        </div>

        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortType)}>
            <SelectTrigger className="w-[120px]" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest" data-testid="option-latest">최신순</SelectItem>
              <SelectItem value="popular" data-testid="option-popular">인기순</SelectItem>
            </SelectContent>
          </Select>

          {isLoggedIn && (
            <Button onClick={onWriteClick} data-testid="button-write">
              <PenSquare className="h-4 w-4 mr-2" />
              글쓰기
            </Button>
          )}

          <ThemeToggle />

          {isLoggedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-profile-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImage} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onMyPostsClick} data-testid="menu-my-posts">
                  <User className="h-4 w-4 mr-2" />
                  내가 쓴 글
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogoutClick} data-testid="menu-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={onLoginClick} data-testid="button-login">
              Google 로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
