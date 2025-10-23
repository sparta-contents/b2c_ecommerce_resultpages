import { CreatePostForm } from "../CreatePostForm";

export default function CreatePostFormExample() {
  return (
    <div className="p-8">
      <CreatePostForm
        onSubmit={(data) => {
          console.log("Form submitted:", data);
          alert("게시물이 작성되었습니다!");
        }}
        onCancel={() => console.log("Cancel clicked")}
      />
    </div>
  );
}
