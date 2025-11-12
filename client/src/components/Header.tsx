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
import { PenSquare, LogOut, User, Shield, Settings, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const logoImage = "/logo.png";

export type SortType = "latest" | "popular";
export type WeekFilter = "공지" | "all" | "1주차 과제" | "2주차 과제" | "3주차 과제" | "4주차 과제" | "5주차 과제" | "6주차 과제";

export interface HeaderProps {
  isLoggedIn?: boolean;
  isAdmin?: boolean;
  user?: {
    name: string;
    profileImage?: string;
  };
  sortBy?: SortType;
  weekFilter?: WeekFilter;
  onSortChange?: (sort: SortType) => void;
  onWeekFilterChange?: (week: WeekFilter) => void;
  onWriteClick?: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onMyPostsClick: () => void;
  onProfileEditClick?: () => void;
  onAdminClick?: () => void;
  onLogoClick?: () => void;
  variant?: 'full' | 'minimal';
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export function Header({
  isLoggedIn = false,
  isAdmin = false,
  user,
  sortBy = 'latest',
  weekFilter = 'all',
  onSortChange,
  onWeekFilterChange,
  onWriteClick,
  onLoginClick,
  onLogoutClick,
  onMyPostsClick,
  onProfileEditClick,
  onAdminClick,
  onLogoClick,
  variant = 'full',
  showBackButton = false,
  onBackClick,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logoImage}
            alt="SPARTA Club"
            className="h-8 cursor-pointer"
            data-testid="img-logo"
            onClick={onLogoClick}
          />
        </div>

        <div className="flex items-center gap-3">
          {variant === 'full' && (
            <>
              <Select value={sortBy} onValueChange={(value) => onSortChange?.(value as SortType)}>
                <SelectTrigger className="w-[120px]" data-testid="select-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest" data-testid="option-latest">최신순</SelectItem>
                  <SelectItem value="popular" data-testid="option-popular">인기순</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => {
                  onWriteClick?.();
                }}
                data-testid="button-write"
              >
                <PenSquare className="h-4 w-4 mr-2" />
                글쓰기
              </Button>

              <ThemeToggle />
            </>
          )}

          {showBackButton && onBackClick && (
            <Button
              variant="outline"
              onClick={onBackClick}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              메인으로 돌아가기
            </Button>
          )}

          {isLoggedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-profile-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImage} />
                    <AvatarFallback>{user.profileImage === undefined ? '' : user.name[0]}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onProfileEditClick && (
                  <DropdownMenuItem onClick={onProfileEditClick} data-testid="menu-profile-edit">
                    <Settings className="h-4 w-4 mr-2" />
                    내 정보 수정
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onMyPostsClick} data-testid="menu-my-posts">
                  <User className="h-4 w-4 mr-2" />
                  내가 쓴 글
                </DropdownMenuItem>
                {isAdmin && onAdminClick && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onAdminClick} data-testid="menu-admin">
                      <Shield className="h-4 w-4 mr-2" />
                      관리자 대시보드
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onLogoutClick();
                  }}
                  data-testid="menu-logout"
                >
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
