import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';

interface WeeklyPostsChartProps {
  data: { week: string; count: number }[];
}

export function WeeklyPostsChart({ data }: WeeklyPostsChartProps) {
  // Format date for display
  const formattedData = data.map(item => ({
    ...item,
    week: new Date(item.week).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }));

  // Calculate default view: last 7 days
  const startIndex = Math.max(0, formattedData.length - 7);
  const endIndex = formattedData.length - 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>일별 게시글 통계</CardTitle>
        <CardDescription>최근 30일간 게시글 작성 추이 (드래그하여 기간 선택)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#8884d8"
              strokeWidth={2}
              name="게시글 수"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Brush
              dataKey="week"
              height={30}
              stroke="#8884d8"
              startIndex={startIndex}
              endIndex={endIndex}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
