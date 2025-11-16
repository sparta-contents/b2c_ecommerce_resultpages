import * as XLSX from 'xlsx';
import type { UserWeeklyPostStatus } from './supabase-api';
import type { HomeworkReviewStatus } from './supabase-hooks';

interface ExcelExportData {
  users: UserWeeklyPostStatus[];
  reviewData: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    userProfileImage: string | null;
    weeklyReviews: {
      [week: string]: HomeworkReviewStatus;
    };
  }>;
}

/**
 * 주차별 게시글 작성 현황을 엑셀 파일로 변환하여 다운로드
 */
export function exportWeeklyStatusToExcel(data: ExcelExportData) {
  const weeks = ['1주차 과제', '2주차 과제', '3주차 과제', '4주차 과제', '5주차 과제', '6주차 과제'];

  // 엑셀 데이터 변환
  const excelData = data.users.map(user => {
    const userReview = data.reviewData.find(r => r.userId === user.id);

    const row: any = {
      '이름': user.name,
      '이메일': user.email,
      '실명': user.approvedName || '-',
      '전화번호': user.approvedPhone || '-',
    };

    // 각 주차별 데이터 추가
    weeks.forEach(week => {
      const postIds = user.weeklyPosts[week] || [];
      const hasSubmitted = postIds.length > 0;
      const reviewStatus = userReview?.weeklyReviews[week] || 'not_reviewed';

      // 제출 여부
      row[`${week.replace(' 과제', '')} 제출`] = hasSubmitted ? 'O' : 'X';

      // 평가 상태
      if (!hasSubmitted) {
        row[`${week.replace(' 과제', '')} 평가`] = '-';
      } else {
        switch (reviewStatus) {
          case 'passed':
            row[`${week.replace(' 과제', '')} 평가`] = '통과';
            break;
          case 'failed':
            row[`${week.replace(' 과제', '')} 평가`] = '미통과';
            break;
          case 'not_reviewed':
            row[`${week.replace(' 과제', '')} 평가`] = '미평가';
            break;
        }
      }

      // 제출 개수 (여러 개 제출한 경우)
      if (postIds.length > 1) {
        row[`${week.replace(' 과제', '')} 제출개수`] = postIds.length;
      }
    });

    return row;
  });

  // 워크시트 생성
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // 컬럼 너비 설정
  const columnWidths = [
    { wch: 12 }, // 이름
    { wch: 25 }, // 이메일
    { wch: 12 }, // 실명
    { wch: 15 }, // 전화번호
  ];

  // 주차별 컬럼 너비 추가
  weeks.forEach(() => {
    columnWidths.push({ wch: 10 }); // 제출
    columnWidths.push({ wch: 10 }); // 평가
  });

  worksheet['!cols'] = columnWidths;

  // 워크북 생성
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '주차별 현황');

  // 파일명 생성 (날짜 포함)
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `수강생_주차별_현황_${dateStr}.xlsx`;

  // 파일 다운로드
  XLSX.writeFile(workbook, fileName);
}
