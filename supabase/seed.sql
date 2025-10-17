-- Seed data for SPARTA Club 프로젝트

-- Create users
INSERT INTO users (id, email, name, profile_image, created_at) VALUES
('fcdfd767-dc51-484a-bfb6-6d687f9e9425', 'example1@sparta.com', '김스파르타', 'https://i.pravatar.cc/150?img=1', NOW() - INTERVAL '10 days'),
('d01658aa-7409-4456-9ab2-b5909fb8b7f0', 'example2@sparta.com', '이코딩', 'https://i.pravatar.cc/150?img=2', NOW() - INTERVAL '10 days'),
('ab49bdbb-2430-4b1f-8554-6d7efe62863e', 'example3@sparta.com', '박개발', 'https://i.pravatar.cc/150?img=3', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- Create posts
INSERT INTO posts (id, user_id, title, content, week, image_url, heart_count, comment_count, created_at, updated_at) VALUES
('2b60cb70-567a-400f-b836-c549aaec323b', 'ab49bdbb-2430-4b1f-8554-6d7efe62863e', '실시간 날씨 정보 앱', 'OpenWeather API를 연동하여 현재 위치의 날씨 정보를 실시간으로 보여주는 웹 앱을 제작했습니다. 온도, 습도, 풍속 등의 정보를 시각적으로 표현했습니다.', '3주차 과제', 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&h=600&fit=crop', 12, 5, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('5d4c7666-aa6a-45b0-acfa-082ae6c95ad7', 'd01658aa-7409-4456-9ab2-b5909fb8b7f0', 'To-Do List 앱 개발', 'JavaScript를 활용한 할 일 관리 애플리케이션입니다. 추가, 삭제, 완료 표시 기능을 구현했고, localStorage를 사용해 데이터를 저장합니다.', '2주차 과제', 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop', 8, 3, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('7a2a5ddb-e111-42c4-9d45-9cd17200e13d', 'ab49bdbb-2430-4b1f-8554-6d7efe62863e', 'API 연동 영화 검색 앱', 'TMDB API를 활용하여 영화를 검색하고 상세 정보를 볼 수 있는 웹 앱입니다. 인기 영화, 개봉 예정 영화 등 다양한 카테고리를 제공합니다.', '3주차 과제', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop', 0, 2, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('ac387c3f-1cd4-46ba-808a-324a96c10d17', 'fcdfd767-dc51-484a-bfb6-6d687f9e9425', '스파르타 클럽 소개 페이지 제작', 'HTML, CSS를 활용하여 스파르타 클럽을 소개하는 랜딩 페이지를 만들었습니다. 반응형 디자인을 적용하여 모바일에서도 잘 보이도록 구현했습니다.', '1주차 과제', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop', 5, 4, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('46f57a35-914c-4080-839e-b17cfd9de604', 'd01658aa-7409-4456-9ab2-b5909fb8b7f0', '계산기 웹앱 제작', 'JavaScript로 기본적인 사칙연산과 괄호 계산까지 가능한 계산기를 만들었습니다. 깔끔한 UI와 함께 키보드 입력도 지원합니다.', '2주차 과제', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop', 0, 2, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('07f68042-060f-4e78-988a-36f4ca7d48a5', 'fcdfd767-dc51-484a-bfb6-6d687f9e9425', '반응형 레이아웃 구현', 'CSS Grid와 Flexbox를 활용하여 다양한 화면 크기에 맞춰지는 반응형 레이아웃을 구현했습니다. 모바일, 태블릿, 데스크톱 모두 완벽하게 대응합니다.', '1주차 과제', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop', 0, 1, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('281129a8-b4f7-4fe5-94f2-0bfd17d8290a', 'd01658aa-7409-4456-9ab2-b5909fb8b7f0', '타이머 앱 개발', 'setInterval을 활용한 카운트다운 타이머 앱입니다. 시작, 정지, 리셋 기능과 함께 알람 기능도 구현했습니다.', '2주차 과제', 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=800&h=600&fit=crop', 0, 1, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('522793aa-9126-40e8-b6fd-441e35000d15', 'fcdfd767-dc51-484a-bfb6-6d687f9e9425', '포트폴리오 웹사이트', '개인 포트폴리오 사이트를 HTML/CSS로 제작했습니다. 프로젝트 갤러리, 소개, 연락처 섹션을 포함하고 있습니다.', '1주차 과제', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', 0, 1, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

-- Create comments for each post
INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES
-- Comments for 실시간 날씨 정보 앱 (5 comments)
(gen_random_uuid(), '2b60cb70-567a-400f-b836-c549aaec323b', 'fcdfd767-dc51-484a-bfb6-6d687f9e9425', 'API 연동이 정말 깔끔하네요! 실시간으로 날씨가 잘 나와요.', NOW() - INTERVAL '5 hours'),
(gen_random_uuid(), '2b60cb70-567a-400f-b836-c549aaec323b', 'd01658aa-7409-4456-9ab2-b5909fb8b7f0', '위치 기반 날씨 정보까지 구현하셨네요. 대박!', NOW() - INTERVAL '4 hours'),
(gen_random_uuid(), '2b60cb70-567a-400f-b836-c549aaec323b', 'ab49bdbb-2430-4b1f-8554-6d7efe62863e', 'UI 디자인도 예쁘고 기능도 완벽합니다 👏', NOW() - INTERVAL '3 hours'),
(gen_random_uuid(), '2b60cb70-567a-400f-b836-c549aaec323b', 'fcdfd767-dc51-484a-bfb6-6d687f9e9425', '5일 예보까지 보여주시다니! 정말 실용적이에요.', NOW() - INTERVAL '2 hours'),
(gen_random_uuid(), '2b60cb70-567a-400f-b836-c549aaec323b', 'd01658aa-7409-4456-9ab2-b5909fb8b7f0', '이번 과제 중에 제일 완성도가 높은 것 같아요!', NOW() - INTERVAL '1 hour'),

-- Comments for To-Do List 앱 개발 (3 comments)
(gen_random_uuid(), '5d4c7666-aa6a-45b0-acfa-082ae6c95ad7', 'fcdfd767-dc51-484a-bfb6-6d687f9e9425', 'To-Do List 기능이 잘 구현되었네요! localStorage 활용도 좋습니다.', NOW() - INTERVAL '3 hours'),
(gen_random_uuid(), '5d4c7666-aa6a-45b0-acfa-082ae6c95ad7', 'ab49bdbb-2430-4b1f-8554-6d7efe62863e', 'UI가 심플하면서도 깔끔해요. 체크박스 애니메이션도 멋져요!', NOW() - INTERVAL '2 hours'),
(gen_random_uuid(), '5d4c7666-aa6a-45b0-acfa-082ae6c95ad7', 'd01658aa-7409-4456-9ab2-b5909fb8b7f0', '코드 구조도 깔끔하고 기능도 완벽하네요 ㅎㅎ', NOW() - INTERVAL '1 hour'),

-- Comments for API 연동 영화 검색 앱 (2 comments)
(gen_random_uuid(), '7a2a5ddb-e111-42c4-9d45-9cd17200e13d', 'fcdfd767-dc51-484a-bfb6-6d687f9e9425', '정말 잘 만드셨네요! 많은 도움이 되었습니다.', NOW() - INTERVAL '2 hours'),
(gen_random_uuid(), '7a2a5ddb-e111-42c4-9d45-9cd17200e13d', 'd01658aa-7409-4456-9ab2-b5909fb8b7f0', '코드가 깔끔하고 이해하기 쉬워요 👍', NOW() - INTERVAL '1 hour'),

-- Comments for 스파르타 클럽 소개 페이지 제작 (4 comments)
(gen_random_uuid(), 'ac387c3f-1cd4-46ba-808a-324a96c10d17', 'd01658aa-7409-4456-9ab2-b5909fb8b7f0', '와 디자인이 정말 깔끔하네요! 레이아웃도 잘 짜셨어요 👍', NOW() - INTERVAL '2 hours'),
(gen_random_uuid(), 'ac387c3f-1cd4-46ba-808a-324a96c10d17', 'ab49bdbb-2430-4b1f-8554-6d7efe62863e', 'HTML/CSS만으로도 이렇게 멋진 페이지를 만들 수 있다니 대단해요!', NOW() - INTERVAL '1 hour'),
(gen_random_uuid(), 'ac387c3f-1cd4-46ba-808a-324a96c10d17', 'fcdfd767-dc51-484a-bfb6-6d687f9e9425', '반응형 디자인 구현이 완벽합니다!', NOW() - INTERVAL '3 hours'),
(gen_random_uuid(), 'ac387c3f-1cd4-46ba-808a-324a96c10d17', 'd01658aa-7409-4456-9ab2-b5909fb8b7f0', '모바일에서도 깔끔하게 나오네요 ㅎㅎ', NOW() - INTERVAL '4 hours'),

-- Comments for 계산기 웹앱 제작 (2 comments)
(gen_random_uuid(), '46f57a35-914c-4080-839e-b17cfd9de604', 'fcdfd767-dc51-484a-bfb6-6d687f9e9425', '디자인도 예쁘고 기능도 완벽해요!', NOW() - INTERVAL '2 hours'),
(gen_random_uuid(), '46f57a35-914c-4080-839e-b17cfd9de604', 'ab49bdbb-2430-4b1f-8554-6d7efe62863e', '저도 따라서 만들어보고 싶어요. 대단합니다!', NOW() - INTERVAL '1 hour'),

-- Comments for 반응형 레이아웃 구현 (1 comment)
(gen_random_uuid(), '07f68042-060f-4e78-988a-36f4ca7d48a5', 'd01658aa-7409-4456-9ab2-b5909fb8b7f0', '완성도가 정말 높네요. 수고하셨습니다!', NOW() - INTERVAL '1 hour'),

-- Comments for 타이머 앱 개발 (1 comment)
(gen_random_uuid(), '281129a8-b4f7-4fe5-94f2-0bfd17d8290a', 'fcdfd767-dc51-484a-bfb6-6d687f9e9425', '정말 잘 만드셨네요! 많은 도움이 되었습니다.', NOW() - INTERVAL '1 hour'),

-- Comments for 포트폴리오 웹사이트 (1 comment)
(gen_random_uuid(), '522793aa-9126-40e8-b6fd-441e35000d15', 'ab49bdbb-2430-4b1f-8554-6d7efe62863e', '코드가 깔끔하고 이해하기 쉬워요 👍', NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Create some hearts
INSERT INTO hearts (id, post_id, user_id) VALUES
(gen_random_uuid(), '2b60cb70-567a-400f-b836-c549aaec323b', 'fcdfd767-dc51-484a-bfb6-6d687f9e9425'),
(gen_random_uuid(), '2b60cb70-567a-400f-b836-c549aaec323b', 'd01658aa-7409-4456-9ab2-b5909fb8b7f0'),
(gen_random_uuid(), '5d4c7666-aa6a-45b0-acfa-082ae6c95ad7', 'fcdfd767-dc51-484a-bfb6-6d687f9e9425'),
(gen_random_uuid(), 'ac387c3f-1cd4-46ba-808a-324a96c10d17', 'd01658aa-7409-4456-9ab2-b5909fb8b7f0')
ON CONFLICT (post_id, user_id) DO NOTHING;
