const commandMap = {
  'user': [
    "enable",
  ],
  'previlege': [
    "configure^terminal",
    "show",
    "show^running-config",
    "show^ip interface brief",
    "show^ip route", 
    "exit",
  ],
  'global config': [
    "line^con 0",
    "line^vty 0 4", 
    "line",
    "router",
    "no^router rip",
    "router^rip",
    "ip^route",  
    "no^ip route",
    "interface^gigabitEthernet[slot/port]",
    "interface^fastEthernet[slot/port]", 
    "interface^vlan[num]",
    "interface",
    "exit"
  ],
  'interface': [
    "ip^address",
    "no^ip^address",
    "shutdown",
    "no^shutdown",
    "description",
    "no^description",
    "exit"
  ],
  'router': [
    "network",
    "no^network",
    "exit",
  ],
}
// 인터페이스 타입 별칭 맵핑

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// 매개변수를 받는 명령어들의 정보
const commandsWithParameters = {
  'ip^route': { 
    minParams: 3,  
    description: 'ip route [destination] [mask] [gateway]'
  },
  'no^ip route': {  
    minParams: 3, 
    description: 'no ip route [destination] [mask] [gateway]'
  },
  'interface^gigabitEthernet[slot/port]': {
    minParams: 0,  
    description: 'interface gigabitEthernet [slot/port]'
  },
  'interface^fastEthernet[slot/port]': {
    minParams: 0,
    description: 'interface fastEthernet [slot/port]'  
  },
  'interface^vlan[num]': {
    minParams: 0,
    description: 'interface vlan [number]'
  }
};
const interfaceAliases = {
  'g': 'gigabitethernet',
  'gi': 'gigabitethernet',
  'gig': 'gigabitethernet',
  'gigabit': 'gigabitethernet',
  'gigabitethernet': 'gigabitethernet',
  'f': 'fastethernet', 
  'fa': 'fastethernet',
  'fast': 'fastethernet',
  'fasteth': 'fastethernet',
  'fastethernet': 'fastethernet',
  'v': 'vlan',
  'vl': 'vlan',
  'vlan': 'vlan'
};

function parseInterfaceInput(input) {
  const words = input.trim().split(/\s+/);
  const result = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const normalized = normalize(word);
    
    // interface 명령어 체크
    if (normalized === 'interface' || normalized === 'int') {
      result.push('interface');
      continue;
    }
    
    // 인터페이스 타입+번호가 붙어있는 경우 (예: g0/0/0, gi0/1, fa0/1)
    const match = word.match(/^([a-zA-Z]+)([0-9\/\.]+)$/);
    if (match) {
      const [, typeStr, numberStr] = match;
      const normalizedType = normalize(typeStr);
      
      // 인터페이스 타입 별칭 확인
      if (interfaceAliases[normalizedType]) {
        result.push(interfaceAliases[normalizedType]);
        // 번호는 매개변수이므로 파싱에서 제외
        continue;
      }
    }
    
    // 일반적인 인터페이스 타입 (공백으로 분리된 경우)
    if (interfaceAliases[normalized]) {
      result.push(interfaceAliases[normalized]);
      // 다음 단어가 숫자/포트 번호면 건너뛰기
      if (i + 1 < words.length && /^[0-9\/\.]+$/.test(words[i + 1])) {
        i++; // 다음 포트 번호 건너뛰기
      }
      continue;
    }
    
    // 그외의 경우는 normalize해서 추가
    result.push(normalized);
  }
  
  return result;
}

function improvedIsValidAbbreviation(input, commandList) {
  const inputWords = parseInterfaceInput(input);
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const cmd of commandList) {
    // ^를 기준으로 분리 (최대 1개만 있음)
    const parts = cmd.split('^');
    let cmdWords = [];
    
    if (parts.length === 1) {
      // ^ 없는 경우: 단일 명령어
      cmdWords = parts[0].split(' ').filter(word => !/^\[.*\]$/.test(word)).map(normalize);
    } else {
      // ^ 있는 경우: 상위^하위 명령어
      const upperPart = parts[0].split(' ').map(normalize);
      const lowerPart = parts[1].split(' ').filter(word => !/^\[.*\]$/.test(word)).map(normalize);
      cmdWords = [...upperPart, ...lowerPart];
    }
    
    // 기본 명령어 부분 매칭 확인
    if (inputWords.length < cmdWords.length) continue;
    
    let score = 0;
    let matched = true;
    
    // 필수 명령어 부분 비교
    for (let i = 0; i < cmdWords.length; i++) {
      const inputWord = inputWords[i];
      const cmdWord = cmdWords[i];
      
      if (inputWord === cmdWord) {
        score += 10;
      } else if (cmdWord.startsWith(inputWord) && inputWord.length > 0) {
        score += 5;
      } else {
        matched = false;
        break;
      }
    }
    
    if (!matched) continue;
    
    // 매개변수가 있는 명령어인지 확인
    const paramInfo = commandsWithParameters[cmd];
    if (paramInfo) {
      const remainingWords = inputWords.length - cmdWords.length;
      if (remainingWords < paramInfo.minParams) {
        score += 1; // 부분 매치
      } else {
        score += 2; // 완전한 명령어
      }
    } else {
      // 매개변수가 없는 명령어는 정확한 길이여야 함
      if (inputWords.length > cmdWords.length) continue;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = cmd;
    }
  }
  
  return bestMatch;
}

// 테스트
console.log("=== 수정된 테스트 결과 ===");
console.log('ip add 200.200.200.1 255.255.255.0 : ', improvedIsValidAbbreviation('ip add 200.200.200.1 255.255.255.0', commandMap["interface"]));
console.log('ip route 192.168.1.0 255.255.255.0 10.0.0.1:', improvedIsValidAbbreviation('ip route 192.168.1.0 255.255.255.0 10.0.0.1', commandMap["global config"]));
console.log('no ip rou 192.168.1.0 255.255.255.0 10.0.0.1:', improvedIsValidAbbreviation('no ip rou 192.168.1.0 255.255.255.0 10.0.0.1', commandMap["global config"]));
console.log('sh ip rou:', improvedIsValidAbbreviation('sh ip rou', commandMap.previlege));
console.log('sh ip int br:', improvedIsValidAbbreviation('sh ip int br', commandMap.previlege));
console.log('interface gi0/0/0:', improvedIsValidAbbreviation('interface gi0/0/0', commandMap["global config"]));
console.log('int vlan 10:', improvedIsValidAbbreviation('int vlan 10', commandMap["global config"]));

// 파싱 테스트 - 문제 확인을 위해
console.log("\n=== 파싱 테스트 ===");
console.log('parseInterfaceInput("no ip rou 192.168.1.0"):', parseInterfaceInput('no ip rou 192.168.1.0'));
console.log('parseInterfaceInput("ip rou"):', parseInterfaceInput('ip rou'));
console.log('parseInterfaceInput("no ip route"):', parseInterfaceInput('no ip route'));

// 명령어 분석 테스트
console.log("\n=== 명령어 분석 테스트 ===");
const testCmd = "no^ip route";
const parts = testCmd.split('^');
console.log('testCmd:', testCmd);
console.log('parts:', parts);

if (parts.length === 1) {
  console.log('단일 명령어:', parts[0].split(' ').map(word => normalize(word)));
} else {
  const upperPart = parts[0].split(' ').map(normalize);
  const lowerPart = parts[1].split(' ').filter(word => !/^\[.*\]$/.test(word)).map(normalize);
  console.log('상위 부분:', upperPart);
  console.log('하위 부분:', lowerPart); 
  console.log('합친 결과:', [...upperPart, ...lowerPart]);
}


/*class Router {
  constructor(config) {
    this.hostname = config.hostname || "Router";
    this.ip = config.ip || "0.0.0.0";
    this.routingTable = config.routingTable || []; // [{ network: "192.168.1.0/24", nextHop: "192.168.1.1" }]
    this.lastConfiguration = '';
  }

  // 라우팅 테이블에서 목적지에 맞는 다음 홉 찾기
  findNextHop(destination) {
    // 간단하게 prefix 매칭 (실제 구현은 서브넷 마스크 연산 필요)
    for (let route of this.routingTable) {
      const [net, prefix] = route.network.split("/");
      if (destination.startsWith(net.split(".").slice(0, prefix / 8).join("."))) {
        return route.nextHop;
      }
    }
    return null; // 경로 없음
  }

  // 패킷 전송
  sendPacket(destination, payload) {
    const nextHop = this.findNextHop(destination);

    if (!nextHop) {
      console.log(`[${this.hostname}] 목적지 ${destination}에 대한 경로를 찾을 수 없습니다.`);
      return { status: "no_route", to: destination };
    }

    console.log(`[${this.hostname}] ${destination}로 패킷 전송 (다음 홉: ${nextHop})`);
    console.log(`Payload: ${JSON.stringify(payload)}`);

    // 실제 전송 로직 시뮬레이션
    return {
      status: "sent",
      to: destination,
      nextHop: nextHop,
      data: payload,
      timestamp: Date.now()
    };
  }

  // 패킷 수신
  receivePacket(packet) {
    console.log(`[${this.hostname}] ${packet.from}로부터 패킷 수신`);
    console.log(`Payload: ${JSON.stringify(packet.data)}`);

    // 목적지가 자기 자신이면 처리
    if (packet.to === this.ip) {
      console.log(`[${this.hostname}] 패킷 처리 완료 (내부 전달)`);
      return { status: "processed", data: packet.data };
    }

    // 아니면 다시 라우팅
    console.log(`[${this.hostname}] 목적지가 나 아님 → 라우팅`);
    return this.sendPacket(packet.to, packet.data);
  }
}

// 사용 예시
const router = new Router({
  hostname: "R1",
  ip: "192.168.0.1",
  routingTable: [
    { network: "192.168.1.0/24", nextHop: "192.168.0.2" },
    { network: "10.0.0.0/8", nextHop: "192.168.0.3" }
  ]
});

// 패킷 전송 시뮬레이션
router.sendPacket("192.168.1.45", { msg: "Hello Network" });
router.receivePacket({ from: "10.0.0.5", to: "192.168.0.1", data: { reply: "Ping" } });
router.receivePacket({ from: "192.168.0.5", to: "10.0.0.77", data: { msg: "Forward me" } });*/
