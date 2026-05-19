# 🚀 Weylus 초저지연 보조 터치 모니터 구성 가이드

이 가이드는 팀원들이 보조 태블릿 PC(Android/iPad/Surface 등)를 우분투 노트북의 **초저지연 무선 보조 터치 모니터**로 쉽고 빠르게 설정할 수 있도록 돕는 100% 명확하고 정밀한 단계별 가이드입니다. 

WebRTC 기술 기반의 Weylus 스트리밍 서버와 Wayland 가상 모니터 루프백을 결합하여, 최고 수준의 반응 속도와 완벽한 터치/스타일러스 감도 매핑을 구현합니다.

---

## 📐 아키텍처 개요 (동작 방식)

```
┌───────────────── Laptop (Linux Host) ─────────────────┐         ┌────── Tablet Client ────────┐
│                                                       │         │                             │
│  GNOME Remote Desktop  ◄─── Local RDP Client          │         │  Chrome/Firefox Browser     │
│  (Headless Virtual-1)      (Remmina - Session Keep)   │         │                             │
│           │                                           │         │             │               │
│           ▼ (PipeWire)                                │  USB    │             ▼               │
│     Weylus Server ────────────────────────────────────┼─────────┼─► Ultra-Low Latency Video   │
│           ▲                                           │ Tether  │  (WebRTC 60 FPS Stream)     │
│           │                                           │         │                             │
│           │                                           │         │             │               │
│  Map Touch Coordinates ◄──────────────────────────────┼─────────┼─────────────┘               │
│  (Touch Mapping Daemon via /dev/uinput)               │         │  Native Touch/Stylus Input  │
└───────────────────────────────────────────────────────┘         └─────────────────────────────┘
```

---

## 🛠️ [1부] 최초 1회 시스템 환경 설정 가이드

노트북에서 처음 설정을 진행할 때 **딱 한 번만** 실행해야 하는 필수 시스템 설정입니다. 터미널을 열고 아래 순서대로 정확하게 명령어를 입력하세요.

### 1단계. GNOME RDP 가상 화면(Headless) 모드 활성화 및 자가 인증서 생성
노트북이 태블릿용 가상 화면을 백그라운드에서 띄울 수 있도록 RDP 기능을 켜고 인증서를 생성합니다.
```bash
# 1. GNOME RDP 원격 데스크톱 기능 활성화
grdctl rdp enable

# 2. RDP 통신에 필요한 SSL 자가 서명 인증서 폴더 생성 및 생성 권한 부여
mkdir -p ~/.config/grd
openssl req -new -x509 -days 365 -nodes \
  -out ~/.config/grd/cert.pem \
  -keyout ~/.config/grd/key.pem \
  -subj "/CN=localhost"

# 3. 생성한 인증서를 GNOME 원격 데스크톱에 등록
grdctl rdp set-tls-cert ~/.config/grd/cert.pem ~/.config/grd/key.pem

# 4. RDP 연결을 위한 계정 이름 및 비밀번호 등록 (보조 모니터 구동 시 사용됨)
#    (예: 사용자명을 "tablet", 비밀번호를 "password123"으로 설정할 경우)
grdctl rdp set-credentials tablet password123
```

### 2단계. Weylus 네이티브 터치 입력을 위한 커널 권한(`uinput`) 설정
태블릿 화면에서 터치하거나 스타일러스 펜을 쓸 때 노트북 마우스가 아닌 **실제 태블릿 좌표계로 다중 터치 주입**이 가능하도록 권한을 엽니다. (보안을 위해 Weylus를 root 권한으로 실행하는 대신 udev 보안 규칙을 등록합니다).
```bash
# 1. uinput 하드웨어 접근 제어 룰 파일 생성
sudo sh -c 'echo "KERNEL==\"uinput\", GROUP=\"uinput\", MODE=\"0660\"" > /etc/udev/rules.d/60-weylus.rules'

# 2. 작성한 udev 규칙 시스템에 재로드 및 반영
sudo udevadm control --reload-rules
sudo udevadm trigger
```

---

## 🚀 [2부] 보조 모니터 실행 및 연결 가이드 (매번 사용 시)

설정이 완료된 후, 실제로 보조 모니터를 켜서 태블릿과 연동할 때 실행하는 3단계 가이드입니다.

### 1단계. 기기 연결 및 스타터 스크립트 실행
1. 태블릿 PC를 노트북에 **USB 케이블로 연결**하고 태블릿 설정에서 **USB 테더링(USB Tethering)**을 활성화합니다.
   *(USB 테더링 연결이 Wi-Fi보다 약 3배 빠르고 끊김이 없는 초저지연을 제공합니다).*
2. 터미널에서 스크립트가 있는 폴더로 이동해 스타터 스크립트를 실행합니다.
   ```bash
   ./start_tablet_monitor.sh
   ```
   *스크립트가 자동으로 USB 연결 IP를 감지하고, Weylus 서버와 RDP 루프백을 백그라운드에 구동합니다.*

### 2단계. RDP 루프백 화면(Remmina) 연결
1. 스크립트 실행 후 노트북 화면에 **Remmina(원격 데스크톱 클라이언트)** 창이 자동으로 켜집니다.
2. `localhost` 또는 `127.0.0.1` 프로필을 더블 클릭하여 접속을 수락하고, 1단계에서 설정했던 RDP 비밀번호(`password123`)를 입력합니다.
3. RDP 화면이 정상적으로 열려 가상 모니터(`Virtual-1`)가 생성된 것을 확인하면, **Remmina 창을 최소화하거나 화면 구석에 치워둡니다.** 
   *(이 창은 가상 모니터를 살아있게 유지해 주는 트리거 역할을 하므로 끄지 마시고 최소화해 주세요).*

### 3단계. 태블릿 브라우저 접속 및 Weylus 설정 세팅
1. 태블릿 PC에서 크롬(Chrome) 또는 파이어폭스(Firefox) 브라우저를 열고 스타터 스크립트가 출력해 준 주소로 접속합니다.
   - **추천 (USB 테더링 초저지연 링크):** `http://10.148.173.31:1701` *(실제 출력된 IP 입력)*
   - **포트포워딩 링크:** `http://localhost:1701`
2. 접속 시 나타나는 검은색 **Weylus 대시보드**에서 아래 세팅을 정확히 지정합니다:
   - **Capture Mode:** `PipeWire` (Wayland 화면 캡처 표준)
   - **Screen:** `Virtual-1` (노트북의 가상 확장 모니터 선택)
   - **Enable:** **Touch** 와 **Stylus** 두 가지 체크박스를 모두 활성화합니다.
3. 설정이 끝나면 대시보드 우측 상단의 **Fullscreen(전체 화면) 아이콘**을 클릭하여 브라우저 주소창을 숨깁니다.
   *(이제 완벽한 터치 입력이 가능한 보조 모니터가 완성되었습니다!).*

---

## 🎨 [3부] 해상도 설정 가이드 (태블릿 맞춤형)

이 가이드는 사용 중인 태블릿 PC 브라우저의 1:1 픽셀 매칭 최적 해상도인 **`1228x768`**로 사전 설정되어 있습니다. 이 해상도는 배율 스케일링 오버헤드가 없어 렌더링 부하가 최소화되며 반응 속도가 가장 빠릅니다.

만약 환경에 따라 해상도를 수정하거나 확인하고 싶다면 아래 단계를 따르세요:
1. `start_tablet_monitor.sh` 파일을 텍스트 에디터로 엽니다.
2. 스크립트 최상단의 `RESOLUTION` 변수가 태블릿 전용 해상도로 지정되어 있는지 확인하거나 변경합니다:
   ```bash
   # 태블릿 PC 전용 최적 해상도 설정 (기본값)
   RESOLUTION="1228x768"
   ```
3. 스크립트를 다시 구동하면 자동으로 이 해상도에 맞춰 RDP 가상 화면 크기가 리사이징되어 1:1 매칭으로 연결됩니다.

---

## 🧹 [4부] 모니터 및 서버 안전하게 종료하기

사용을 모두 마친 후 노트북 리소스를 낭비하지 않도록 Weylus 서버, 백그라운드 터치 추적 데몬 및 Remmina 루프백 세션을 깨끗이 정돈하고 종료합니다.
```bash
pkill -f weylus
```
*(해당 명령어를 터미널에 입력하면 모든 구동 프로세스가 한 번에 깔끔히 소멸합니다).*
