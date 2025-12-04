interface UserAvatarProps {
  initials?: string;
}

export default function UserAvatar({ initials }: UserAvatarProps) {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-indigo-500",
    "bg-cyan-500",
  ];

  // Default to "U" if initials is undefined or empty
  const displayInitials = initials || "U";
  const colorIndex = displayInitials.charCodeAt(0) % colors.length;

  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full ${colors[colorIndex]} text-sm font-semibold text-white`}
    >
      {displayInitials}
    </div>
  );
}
