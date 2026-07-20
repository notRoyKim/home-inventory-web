import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Text } from '@react-three/drei';

export default function App() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    // ★ 주의: 아래 URL을 본인이 만든 Cloudflare Worker 주소로 반드시 변경하세요!
    // 예시: "https://home-inventory-api.여러분의아이디.workers.dev/api/items"
    const WORKER_URL =
      'https://lingering-band-71f9.sinant7616.workers.dev/api/items';

    fetch(WORKER_URL)
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error('데이터 불러오기 실패:', err));
  }, []);

  return (
    <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
      <OrbitControls makeDefault />
      <Grid
        infiniteGrid
        fadeDistance={20}
        sectionColor="#666"
        cellColor="#444"
      />
      <ambientLight intensity={0.5} />
      <Environment preset="city" />

      {/* 테스트용 3D 박스 */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>

      {/* Worker(D1)에서 가져온 데이터를 3D 공간의 텍스트로 표시 */}
      {items.length > 0 ? (
        <Text position={[0, 1.5, 0]} fontSize={0.5} color="white">
          {items[0].name} ({items[0].description})
        </Text>
      ) : (
        <Text position={[0, 1.5, 0]} fontSize={0.3} color="white">
          데이터를 불러오거나 Worker 주소를 확인하세요...
        </Text>
      )}
    </Canvas>
  );
}
