import meadow from "@/assets/bg-meadow.jpg";
import rainyStudy from "@/assets/bg-rainy-study.jpg";
import forestPath from "@/assets/bg-forest-path.jpg";
import sunsetField from "@/assets/bg-sunset-field.jpg";
import quietLake from "@/assets/bg-quiet-lake.jpg";
import cloudSky from "@/assets/bg-cloud-sky.jpg";

export interface BgOption {
  id: string;
  label: string;
  hint: string;
  src?: string;
  animated?: boolean; // true = use CSS animation overlay
}

export const BACKGROUNDS: BgOption[] = [
  { id: "none", label: "Trắng tinh", hint: "Mặc định, sáng & sạch" },
  { id: "meadow", label: "Đồng cỏ buổi sớm", hint: "Nắng vàng dịu, hoa cúc nhỏ", src: meadow },
  { id: "rainy-study", label: "Phòng đọc mưa rơi", hint: "Đèn ấm, mưa ngoài cửa", src: rainyStudy },
  { id: "forest-path", label: "Lối nhỏ trong rừng", hint: "Bụi sáng bay nhẹ", src: forestPath, animated: true },
  { id: "sunset-field", label: "Hoàng hôn ấm", hint: "Cánh đồng pastel", src: sunsetField },
  { id: "quiet-lake", label: "Hồ nước phẳng", hint: "Sương sớm, gương mặt nước", src: quietLake },
  { id: "cloud-sky", label: "Bầu trời chậm", hint: "Mây trôi nhẹ", src: cloudSky, animated: true },
];

export function getBackground(id: string) {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}
