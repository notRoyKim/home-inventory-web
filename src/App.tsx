import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Text } from '@react-three/drei';
import { startRegistration } from '@simplewebauthn/browser';

export default function App() {
  const [items, setItems] = useState<any[]>([]);
  const [authStatus, setAuthStatus] = useState<string>("로그인 안 됨");
  const [inviteCode, setInviteCode] = useState<string>("");

  const WORKER_URL = "https://lingering-band-71f9.sinant7616.workers.dev";

  useEffect(() => {
    fetch(`${WORKER_URL}/api/items`, { 
      credentials: "include" // ★ 추가
    })
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error("데이터 불러오기 실패:", err));
  }, []);

  // 지문 등록 함수
  const handleRegisterFingerprint = async () => {
    try {
      setAuthStatus("서버에서 등록 옵션 가져오는 중...");
      
      // 1. 프론트엔드에서 랜덤한 기기 고유 ID 생성 (UUID 형태)
      const randomUserId = crypto.randomUUID(); 

      // 2. 백엔드에 이 랜덤 ID를 함께 보냅니다.
      const res = await fetch(`${WORKER_URL}/api/auth/register-options`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" }, // ★ 이 헤더가 빠지면 서버가 JSON을 못 읽습니다
        credentials: "include",
        body: JSON.stringify({ 
          userId: randomUserId,
          inviteCode: inviteCode // ★ 이 변수 이름이 서버에서 읽는 이름과 정확히 같아야 합니다
        }) 
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error);
     }
      
      const options = await res.json();
      setAuthStatus("기기 지문 센서를 터치해주세요...");

      // 3. 지문 인식 창 띄우기
      const credResponse = await startRegistration(options);
      setAuthStatus("지문 검증 및 저장 중...");

      // 4. 생성된 지문 정보와 아까 만든 랜덤 ID를 함께 서버로 전송
      const verifyRes = await fetch(`${WORKER_URL}/api/auth/register-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          credential: credResponse, 
          userId: randomUserId // ★ 수정됨
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        setAuthStatus("✨ 지문 등록 완료! (내 기기 전용 계정 생성됨)");
      } else {
        setAuthStatus("등록 실패: " + verifyData.error);
      }
    } catch (error: any) {
      console.error(error);
      setAuthStatus("에러 발생: " + error.message);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 20, left: 20, zIndex: 10,
        background: 'rgba(0,0,0,0.7)', color: 'white', padding: '15px', borderRadius: '10px'
      }}>
        <h3>집 3D 인벤토리</h3>
        <p>상태: {authStatus}</p>
        
        {/* ★ 초대 코드 입력 폼 추가 */}
        <input 
          type="password" 
          placeholder="초대(마스터) 코드" 
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          style={{ padding: '8px', marginBottom: '10px', width: '100%', borderRadius: '5px', border: 'none' }}
        />
        <br/>
        
        <button 
          onClick={handleRegisterFingerprint}
          style={{ padding: '10px 15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          지문 등록(초대코드 필요)
        </button>
      </div>

      {/* 3D 캔버스 영역 */}
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <OrbitControls makeDefault />
        <Grid infiniteGrid fadeDistance={20} sectionColor="#666" cellColor="#444" />
        <ambientLight intensity={0.5} />
        <Environment preset="city" />

        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>

        {items.length > 0 && (
          <Text position={[0, 1.5, 0]} fontSize={0.4} color="white">
            {items[0].name} ({items[0].description})
          </Text>
        )}
      </Canvas>
    </div>
  );
}