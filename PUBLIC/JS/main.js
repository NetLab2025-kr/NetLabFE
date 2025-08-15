//import { createElement } from 'react';
import commands from './command_db.js';
import default_config from './defaultConfiguration.js';

const Routers = [];

class Router{
  constructor(data){
    this.data = data;
    this.lastConfiguration = '';
    this.stepDelay = 1000;
  }

  checkNextHopAlive(nextHop) {
    // 라우팅 테이블에서 nextHop이 directly connected인지 찾기
    const connectedRoute = this.data.Datas.routingTable.find(obj =>
        obj.code === 'C' && obj.destination === nextHop
    );

    if (!connectedRoute) return false;

    // 해당 route의 interface 상태 확인
    const ifaceName = connectedRoute.interface;
    const iface = this.data.Interface[ifaceName];

    if (!iface) return false;

    // shutdown 상태면 false
    if (iface.shutdown === true) return false;

    return true;
  }


  findNextHop(destination) {
    const destInt = this.ipToInt(destination);

    let bestMatch = null;
    let longestPrefix = -1; 

    for (let route of this.data.Datas.routingTable) {
        const netInt = this.ipToInt(route.destination);
        const maskInt = this.ipToInt(route.mask);

        if ((destInt & maskInt) === (netInt & maskInt)) {
            const prefixLength = this.maskToPrefix(maskInt);

            // 다음 홉이 살아있거나, 직접 연결망이면
            if (this.checkNextHopAlive(route.nextHop) || route.nextHop === "0.0.0.0") {
                if (prefixLength > longestPrefix) {
                    longestPrefix = prefixLength;
                    bestMatch = route.nextHop;
                }
            }
        }
    }
    return bestMatch;
  }


  // IP 문자열 → 32비트 정수
  ipToInt(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  // 서브넷 마스크 → prefix 길이 (예: 255.255.255.0 → 24)
  maskToPrefix(maskInt) {
    let count = 0;
    for (let i = 31; i >= 0; i--) {
      if ((maskInt >> i) & 1) count++;
      else break; // 연속된 1만 세기
    }
    return count;
  }

   // 패킷 전송 (실시간 시뮬레이션)
  findRouterByIp(ip) {
    return this.network.find(router => router.hasIp(ip));
  }

  // 내 인터페이스 IP인지 확인 (기존 isLocalIP 함수)
  hasIp(ip) {
    for (let ifaceName in this.data.Interface) {
      if (this.data.Interface[ifaceName].ip_address === ip) return true;
    }
    return false;
  }

  async sendPacket(destination, payload) {
    const nextHop = this.findNextHop(destination);

    if (!nextHop) {
      console.log(`[${this.data.hostname}] 목적지 ${destination}에 대한 경로 없음`);
      return { status: "no_route", to: destination };
    }

    console.log(`[${this.data.hostname}] ${destination}로 패킷 전송 (다음 홉: ${nextHop})`);
    console.log("전송 중...");

    await new Promise(r => setTimeout(r, this.stepDelay));

    // 다음 홉 라우터 객체 찾기
    const nextRouter = this.findRouterByIp(nextHop);
    if (!nextRouter) {
      console.log(`[${this.data.hostname}] 다음 홉 ${nextHop} 라우터를 찾을 수 없음`);
      return { status: "next_hop_not_found", to: nextHop };
    }

    // 다음 라우터의 receivePacket 호출, 출발지 라우터 정보도 넘겨줌
    return nextRouter.receivePacket({
      from: this.data.hostname,
      to: destination,
      data: payload
    });
  }

  async receivePacket(packet) {
    console.log(`[${this.data.hostname}] ${packet.from}로부터 패킷 수신`);

    await new Promise(r => setTimeout(r, this.stepDelay));

    // 내 IP 중 하나와 목적지 IP 비교 (직접 연결된 IP 중 하나일 경우)
    if (this.hasIp(packet.to)) {
      console.log(`[${this.data.hostname}] 목적지 도착. 패킷 처리 완료.`);
      return { status: "processed", data: packet.data };
    }

    console.log(`[${this.data.hostname}] 목적지가 나 아님 → 다시 라우팅`);
    return this.sendPacket(packet.to, packet.data);
  }

  
}

const Links = [
  //{from:'장비1 이름',f_interface:'인터페이스 이름',to:'장비2 이름',t_interface:'인터페이스 이름'}
]; //링크 저장

const commandMap = {
  'user': [
    "enable",
  ],
  'previlige': [
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

function getParamNames(func) {
  const str = func.toString();
  const paramPart = str
    .replace(/\/\/.*$|\/\*[\s\S]*?\*\//mg, '') // 주석 in
    .match(/^[^\(]*\(\s*([^\)]*)\)/m)?.[1];

  if (!paramPart) return [];

  // 구조 분해를 고려해서 쉼표 기준으로 안전하게 파싱
  let depth = 0;
  let current = '';
  const rawParams = [];

  for (let char of paramPart) {
    if (char === ',' && depth === 0) {
      rawParams.push(current.trim());
      current = '';
    } else {
      if (char === '{' || char === '[') depth++;
      if (char === '}' || char === ']') depth--;
      current += char;
    }
  }
  if (current.trim()) rawParams.push(current.trim());

  // 내부 구조분해도 이름만 뽑기
  const extractNames = (param) => {
    if (param.startsWith('{') || param.startsWith('[')) {
      return param
        .replace(/[\{\[\]\}]/g, '')           // 중괄호/대괄호 제거
        .split(',')
        .map(p => p.trim().split('=')[0])     // 디폴트 값 제거
        .map(p => p.split(':').pop().trim())  // 별칭 제거 (a: b → b)
        .filter(Boolean);
    } else {
      return [param.split('=')[0].trim()];    // 일반 변수
    }
  };

  return rawParams.flatMap(extractNames);
}


function getCLI_ModeType(str){
  if(str == "user"){
    return '>'
  }
  else if(str == "previlige"){
    return '#';
  }
  else if(str == "global config"){
    return '(config) #';
  }

  const splited = str.split(':');

  if(splited[0] == "interface"){
    return '(config-if) #';
  }
  else if(splited[0] == "router"){
    return '(config-router) #';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const bar = document.getElementById('bar');
  const topology_frame = document.getElementById('topology-frame');
  const topology_inner = document.getElementById('topology-inner');
  const buttons = bar.getElementsByClassName('tools');
  let tempTarget = null;

  var selectedDeviceId = null;
  let current_names= new Map(); //현재 존재하는 토폴로지 {토폴로지 이름 : 토폴로지 객체}
  let is_dragging = false;
  let clone = null;
  let dragg_default_name = "";
  let dragg_default_type = "";
  let scale = 1; //크기
  var firstClicked = null;
  var tempLine = null;
  window.console_line = ["#03f8fc", "Bezier", "9999 0"];
  window.straight_line = ["#000000", "Straight", "9999 0"];
  window.cross_line = ["#000000", "Straight", "3 2"];
  window.fiver_line = ["#fcb103", "Straight", "9999 0"];
  window.serial_line = ["#fc0303", "Flowchart", "9999 0"];
  document.body.dataset.connection = "";

  //줌 설정
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 2.5;
  const STEP = 0.1;

  //전역 jsPlumb 세팅
  const instance = jsPlumb.getInstance({
    Container: "topology-inner"
  });

  // ---------------------------------

  function applyZoom(newScale, originX, originY) {
    const prev = scale;
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale)); //클램핑 -> 줌 설정
    topology_inner.style.transform = scale(`${scale}`); //토폴로지 설정 되는 위치 설정

    //위치 보정 -> topology-frame안에서 어디를 가리키고 있는지 이전 스케일 기준 계산 by google map...
    const frameRect = topology_frame.getBoundingClientRect();
    const mouseX = (originX - frameRect.left + topology_frame.scrollLeft) / prev; //originX, Y : 마우스 좌표, frameRect : frameRect의 좌표, scroll : 스크롤 된 양, prev : 예전 스케일
    const mouseY = (originY - frameRect.top + topology_frame.scrollTop) / prev;

    //마우스가 가리키는 위치를 화면 가운데 오도록 설정 by google map...
    topology_frame.scrollLeft = mouseX * scale - (originX - frameRect.left);
    topology_frame.scrollTop = mouseY * scale - (originY - frameRect.top);
  }

  // --- 줌인 줌 아웃 ---
  topology_frame.addEventListener('wheel', e => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const delta = (e.deltaY < 0) ? STEP : -1 * STEP;
    applyZoom(scale + delta, e.clientX, e.clientY);
  });

  // --- 드래그 중 ---
  document.addEventListener('mousemove', e => {
    if (!is_dragging || !clone) return;
    const frameRect = topology_frame.getBoundingClientRect();

    //마우스가 실제로 어디를 가리키는지 확인
    const ix = (e.clientX - frameRect.left + topology_frame.scrollLeft) / scale;
    const iy = (e.clientY - frameRect.top + topology_frame.scrollTop) / scale;

    //이미지 중심 확인
    const hw = clone.offsetWidth / 2;
    const hh = clone.offsetHeight / 2;
    clone.style.left = `${ix - hw}px`;
    clone.style.top = `${iy - hh}px`;
  });


  // 선 클릭 시 상태변화
  document.querySelectorAll('.connections').forEach(connection => {
    connection.addEventListener('click', () => {
      if(document.body.dataset.connection) {
        document.body.dataset.connection = "";
        document.body.style.cursor = "pointer";
      } else {
        document.body.style.cursor = "grab";
        document.body.dataset.connection = connection.id; // 필요하면 id 저장
      }
    });
  });


  // --- 놓기 토폴로지 생성 ---
  document.addEventListener('mouseup', e => {
    if (!clone) return;
    
    clone.style.pointerEvents = 'auto';
    clone.style.cursor = 'grab';

    clone.hidden = true; 
    const under = document.elementFromPoint(e.clientX, e.clientY);
    clone.hidden = false;

    if (under && under.closest('#topology-frame') && dragg_default_name) {
      // 유니크 id 생성
      let idx = 0;
      let deviceId;
      do {
        deviceId = `${dragg_default_name}${idx++}`;
      } while(current_names.has(deviceId));

      clone.id = deviceId;
      let obj = null;

      if(dragg_default_name == "router"){ //스위치나 다른 객체도 추가 필요 [바꿔]
        obj = new Router(structuredClone(default_config.Router));
        Routers.push(obj);
        obj.network = Routers;

        current_names.set(deviceId, obj);
      }
      
      
      obj.data.hostname = deviceId;


      // 위치 보정
      const frameRect = topology_frame.getBoundingClientRect();
      const ix = (e.clientX - frameRect.left + topology_frame.scrollLeft) / scale;
      const iy = (e.clientY - frameRect.top + topology_frame.scrollTop) / scale;
      const hw = clone.offsetWidth / 2;
      const hh = clone.offsetHeight / 2;
      clone.style.left = `${ix - hw}px`;
      clone.style.top = `${iy - hh}px`;

      topology_inner.appendChild(clone);

      instance.draggable(clone);


      // 현재 기기가 라우터나 스위치면 cli 생성 & 클릭시 cli 보이게
      if ((dragg_default_type === "router" || dragg_default_type === "switch") && !document.body.dataset.connection) {
        clone.addEventListener('click', () => {
          selectDeviceCLI(deviceId);
          document.getElementById('cli').style.display = 'flex';
        });

        // CLI 생성 및 #cli-container에 추가
        const cli = createCLIInterface(deviceId, dragg_default_name);
        document.getElementById('cli-container').appendChild(cli);

      }

          
      var elements = document.querySelectorAll(".topology-wrapper");

      elements.forEach(function(el) {
        el.addEventListener("click", function() {
          if(document.body.dataset.connection) {
            var connType = window[document.body.dataset.connection]; // 전역변수 참조
            var strokeColor = connType[0]; // 색상
            var connectorType = connType[1]; // 라인 타입
            var dotline = connType[2]; // 실선 점선
            
            if (!firstClicked) {
              firstClicked = el;
              el.classList.add("selected");

              tempTarget = document.createElement('div');
              tempTarget.style.width = "1px";
              tempTarget.style.height = "1px";
              tempTarget.style.position = "absolute";
              tempTarget.style.pointerEvents = "none";
              document.body.appendChild(tempTarget);

              tempLine =  instance.connect({
                source: firstClicked,
                target: tempTarget,
                connector: connectorType,
                overlays: []
              });


              // 마우스 커서 따라다님
              document.addEventListener('mousemove', moveTempLine);
              
            } else {
              if (firstClicked !== el) {
                console.log(`firstClicked = ${firstClicked.id}, el = ${el.id}`);
                var existing = instance.getConnections().some(function(conn) {
                  return (conn.source.id === firstClicked.id && conn.target.id === el.id) ||
                         (conn.source.id === el.id && conn.target.id === firstClicked.id);
                });

                if(!existing) {

                  instance.connect({
                    source: firstClicked.id,
                    target: el.id,
                    connector: connectorType,
                    paintStyle: { stroke: strokeColor, strokeWidth: 4, dashstyle: dotline },
                    anchor: "Center"
                  });
                }
                if(tempLine) instance.deleteConnection(tempLine);
                if(tempTarget) document.body.removeChild(tempTarget);

                firstClicked?.classList.remove("selected");
                tempLine = null;
                firstClicked = null;
                document.removeEventListener('mousemove', moveTempLine);
                document.body.dataset.connection = "";
                return;
              }  
            }
          }
        });
      });

      function moveTempLine(e) {
        if(!tempTarget) return;
        const offsetX = tempTarget.offsetWidth / 2;
        const offsetY = tempTarget.offsetHeight / 2;

        tempTarget.style.left = e.pageX - offsetX + "px";
        tempTarget.style.top = e.pageY - offsetY + "px";
      }
      

      // 새 기기 선택 및 부팅 시퀀스 실행
      setTimeout(() => {
         selectedDeviceId = deviceId;
        selectDeviceCLI(deviceId);
        playBootSequence();
      }, 0);
    } else {
      clone.remove();
    }

    clone = null;
    is_dragging = false;
    dragg_default_name = "";
  });

  

  // cli 생성 함수
  function createCLIInterface(deviceId, deviceType) {
    const cliBox = document.createElement('div');
    cliBox.className = 'cli-box';
    cliBox.dataset.target = deviceId;
    cliBox.style.display = 'none';

    const cliOutput = document.createElement('div');
    cliOutput.className = 'cli-output';

    const cliInputLine = document.createElement('div');
    cliInputLine.className = 'cli-input-line';

    const cliPrompt = document.createElement('span');;
    cliPrompt.className = 'cli-prompt';
    cliPrompt.textContent = `${deviceType}>`;

    const cliInput = document.createElement('input');
    cliInput.className = 'cli-input';
    cliInput.type = 'text';
    cliInput.autocompleted = 'off';
    cliInput.disabled = true; // 부팅 전 비활성화

    cliInputLine.appendChild(cliPrompt);
    cliInputLine.appendChild(cliInput);

    cliBox.appendChild(cliOutput);
    cliBox.appendChild(cliInputLine);

    //입력 처리
    cliInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !cliInput.disabled) {
        const inputVal = cliInput.value.trim();
        if (!inputVal) return;

        const config = current_names.get(selectedDeviceId).data;

        let current_category = null;
        if(config.CLI_Category.includes(':')){
          current_category = config.CLI_Category.split(':')[0];
        }else{
          current_category = config.CLI_Category;
        }

        const command_mapper = commandMap[current_category];
        console.log(inputVal);
        var DetailedCommand = improvedIsValidAbbreviation(inputVal,command_mapper);
        if(!DetailedCommand){
          printCLI('Inputed Command is ambiguous or non existed',selectedDeviceId);
          return;
        }

        console.log(DetailedCommand)
        DetailedCommand = DetailedCommand.split('^');

        let run_func = null;
        let current_depth_command = commands[DetailedCommand[0]].options;
        if('NONE' in current_depth_command && !DetailedCommand[1]){
          run_func = current_depth_command['NONE'].run;
        }else if('LINE' in current_depth_command){
          run_func = current_depth_command['LINE'].run;
        }else{
          run_func = current_depth_command[DetailedCommand[1]].run;
        }

        const Neededparams = getParamNames(run_func); //커맨드 호출에 필요한 인자 확인
        let params = {}; //인자 <- 커맨드 호출시 넣을 거
        if(Neededparams.includes('config')){
          params['config'] = config;
        }

        if(Neededparams.includes('commandLine')){
          params['commandLine'] = inputVal;
        }
        
        const returnValue = run_func(params);
        
        if(returnValue['action'] == 'print_CLI'){ //액션 처리
          printCLI(returnValue['value'],selectedDeviceId);
        }

        const div = document.createElement('div');
        div.textContent = `${cliPrompt.textContent} ${inputVal}`;
        cliOutput.appendChild(div); //출력
        cliInput.value = '';
        cliOutput.scrollTop = cliOutput.scrollHeight;
        cliPrompt.textContent = `${selectedDeviceId}${getCLI_ModeType(config.CLI_Category)}`;
      }
    });

    return cliBox;
  }

  // 기기 클릭 시 cli 띄우는 함수
  function selectDeviceCLI(deviceId) {
    selectedDeviceId = deviceId;

    // 모든 CLI 숨김
    document.querySelectorAll('#cli-container > .cli-box').forEach(cli => {
      cli.style.display = 'none';
    });

    // 선택한 CLI만 보임
    const targetCLI = document.querySelector(`.cli-box[data-target="${deviceId}"]`);
    if (targetCLI) {
      targetCLI.style.display = 'flex';
      const cliInput = targetCLI.querySelector('.cli-input');
      if (cliInput) cliInput.focus();
    }
  }

  // 현재 선택된 기기의 cli 내부 요소들을 설정하는 함수
  function getCurrentCLIElement() {
    if (!selectedDeviceId) return {};
    const currentBox = document.querySelector(`.cli-box[data-target="${selectedDeviceId}"]`);
    if (!currentBox) return {};
    return {
      cliOutput: currentBox.querySelector('.cli-output'),
      cliInput: currentBox.querySelector('.cli-input'),
      cliPrompt: currentBox.querySelector('.cli-prompt'),
    };
  }

  // --- CLI 출력 함수 ---
  // text: 출력할 문자열 또는 배열(배열이면 한 줄씩 출력)
  // options: { delay: ms (줄 단위 딜레이, 기본 0), scroll: boolean(스크롤 자동, 기본 true) }
  function printCLI(text, deviceId, options = {}) {
    const { delay = 0, scroll = true } = options;

    // 동적으로 선택된 기기의 cli-output을 찾음
    return new Promise(async resolve => {
      const targetCLI = document.querySelector(`.cli-box[data-target="${deviceId}"] .cli-output`);
      if(!targetCLI) {
        console.warn(`[PrintCLI] CLI output for ${deviceId} not found`);
        resolve();
        return;
      }

      if (Array.isArray(text)) {
        // 배열일 때는 한 줄씩 순차 출력 (delay 있을 때)
        for (const line of text) {
          const div = document.createElement('div');
          div.innerHTML = line;
          targetCLI.appendChild(div);
          if (scroll) targetCLI.scrollTop = targetCLI.scrollHeight;
          if (delay > 0) await new Promise(r => setTimeout(r, delay));
        } 
        resolve();
      } else {
        // 문자열 단일 출력
        const div = document.createElement('div');
        div.innerHTML = text;
        targetCLI.appendChild(div);
        if (scroll) targetCLI.scrollTop = targetCLI.scrollHeight;
        resolve();
      }
    });
  }

  // --- 로딩 바 애니메이션 출력 함수 ---
  // barStr: '#' 문자열 긴거
  // stepDelay: 한 글자씩 찍는 딜레이(ms)
  async function printLoadingBar(deviceId, barStr, stepDelay = 40) {
      const targetCLI = document.querySelector(`.cli-box[data-target="${deviceId}"] .cli-output`);
      if(!targetCLI) {
        return;
      }
    
    const div = document.createElement('div');
    targetCLI.appendChild(div);

    for (let i = 1; i <= barStr.length; i++) {
      div.innerHTML = barStr.slice(0, i);
      targetCLI.scrollTop = targetCLI.scrollHeight;
      await new Promise(r => setTimeout(r, stepDelay));
    }
  }

  // --- 부팅 시퀀스 출력 함수 ---
  async function playBootSequence() {
    
    const { cliOutput, cliInput, cliPrompt } = getCurrentCLIElement();
    if (!cliOutput || !cliInput || !cliPrompt) return;

    cliOutput.textContent = '';
    cliInput.disabled = true;
    cliPrompt.textContent = `${selectedDeviceId}>`;

    // 부팅 메시지 출력 (printCLI, printLoadingBar는 기존에 구현한 함수들)
    await printCLI(bootLinesBefore, selectedDeviceId, { delay: 50 });
    await printLoadingBar(selectedDeviceId, bootLoadingBar);
    await printCLI(bootLinesAfter, selectedDeviceId, { delay: 50 });

    cliInput.disabled = false;
    cliInput.focus();
  }

  // --- 부팅 메시지 데이터 ---
  const bootLinesBefore = [
    '<span class="boot-message">Initializing Hardware ...</span>',
    '<span class="boot-message">\n</span>',
    '<span class="boot-message">Checking for PCIe device presence...done</span>',
    '<span class="boot-message">System integrity status: 0x610</span>',
    '<span class="boot-message">Rom image verified correctly</span>',
    '<span class="boot-message">\n</span>',
    '<span class="boot-message">System Bootstrap, Version 16.7(3r), RELEASE SOFTWARE</span>',
    '<span class="boot-message">Copyright (c) 1994-2018  by NetLab Systems, Inc.</span>',
    '<span class="boot-message">\n</span>',
    '<span class="boot-message">Current image running: Boot ROM0</span>',
    '<span class="boot-message">\n</span>',
    '<span class="boot-message">Last reset cause: LocalSoft</span>',
    '<span class="boot-message">NetLab ISR4331/K9 platform with 4194304 Kbytes of main memory</span>',
    '<span class="boot-message">\n\n\n</span>',
  ];

  const bootLoadingBar = '<span class="boot-message">##########################################################################################################################</span>';

  const bootLinesAfter = [
    '<span class="boot-message">Package header rev 1 structure detected</span>',
    '<span class="boot-message">IsoSize = 550114467</span>',
    '<span class="boot-message">Calculating SHA-1 hash...Validate package: SHA-1 hash:</span>',
    '<span class="boot-message">\t\tcalculated 444F4D02:44C58887:D9C8942B:C557D3CF:2A14247E</span>',
    '<span class="boot-message">\t\texpected   444F4D02:44C58887:D9C8942B:C557D3CF:2A14247E</span>',
    '<span class="boot-message">\n</span>',
    '<span class="boot-message">RSA Signed RELEASE Image Signature Verification Successful.</span>',
    '<span class="boot-message">Image validated</span>',
    '<span class="boot-message">\n\n</span>',
    '<span class="boot-message">\t\t  Restricted Rights Legend</span>',
    '<span class="boot-message">\n</span>',
    '<span class="boot-message">Use, duplication, or disclosure by the Government is</span>',
    '<span class="boot-message">subject to restrictions as set forth in subparagraph</span>',
    '<span class="boot-message">(c) of the Commercial Computer Software - Restricted</span>',
    '<span class="boot-message">Rights clause at FAR sec. 52.227-19 and subparagraph</span>',
    '<span class="boot-message">(c) (1) (ii) of the Rights in Technical Data and Computer</span>',
    '<span class="boot-message">Software clause at DFARS sec. 252.227-7013.</span>',
    '<span class="boot-message">\n</span>',
    '<span class="boot-message">\t\t   NetLab Systems, Inc.</span>',
    '<span class="boot-message">\t\t   170 West Tasman Drive</span>',
    '<span class="boot-message">\t\t   San Jose, California 95134-1706</span>',
    '<span class="boot-message">\n</span>',
    '<span class="boot-message">NetLab IOS Software[Everest], ISR Software(X86_64_LINUX_IOSD - UNIVERSALK9 - M), Version 16.6.4, RELEASE SOFTWARE(fc3)</span>',
    '<span class="boot-message">Technical Support : http://NetLab.kr</span>',
    '<span class="boot-message">Copyright(c) 2025 - 2025 by NetLab Systems, Inc.</span>',
    '<span class="boot-message">Compiled Sun 08 - Jul - 18 04:33 by mcpre</span>',
    '<span class="boot-message">\n\n\n</span>',
    '<span class="boot-message">NetLab IOS software, Copyright(c) 2025 - 2025 by NetLab Systems, Inc.</span>',
    '<span class="boot-message">All rights reserved.Certain components of NetLab IOS software are</span>',
    '<span class="boot-message">licensed under the GNU General Public License("GPL") Version 2.0.The</span>',
    '<span class="boot-message">software code licensed under GPL Version 2.0 is free software that comes</span>',
    '<span class="boot-message">with ABSOLUTELY NO WARRANTY.You can redistribute and / or modify such</span>',
    '<span class="boot-message">GPL code under the terms of GPL Version 2.0.For more details, see the</span>',
    '<span class="boot-message">documentation or "License Notice" file accompanying the IOS - XE software,</span>',
    '<span class="boot-message">or the applicable URL provided on the flyer accompanying the IOS - XE</span>',
    '<span class="boot-message">software.</span>',
    '<span class="boot-message">\n\n\n</span>',
    '<span class="boot-message">This product contains cryptographic features and is subject to United</span>',
    '<span class="boot-message">States and local country laws governing import, export, transfer and</span>',
    '<span class="boot-message">use. Delivery of NetLab cryptographic products does not imply</span>',
    '<span class="boot-message">third-party authority to import, export, distribute or use encryption.</span>',
    '<span class="boot-message">Importers, exporters, distributors and users are responsible for</span>',
    '<span class="boot-message">compliance with U.S. and local country laws. By using this product you</span>',
    '<span class="boot-message">agree to comply with applicable laws and regulations. If you are unable</span>',
    '<span class="boot-message">to comply with U.S. and local laws, return this product immediately.</span>',
    '<span class="boot-message">\n</span>',
    '<span class="boot-message">A summary of U.S. laws governing NetLab cryptographic products may be found at:</span>',
    '<span class="boot-message">http://NetLab.kr</span>',
    '<span class="boot-message">\n</span>',
    '<span class="boot-message">If you require further assistance please contact us by sending email to</span>',
    '<span class="boot-message">netlabkr@gmail.com.</span>',
    '<span class="boot-message">\n</span>',
    '<span class="boot-message">NetLab ISR4331/K9 (1RU) processor with 1795999K/6147K bytes of memory.</span>',
    '<span class="boot-message">Processor board ID FLM232010G0</span>',
    '<span class="boot-message">3 Gigabit Ethernet interfaces</span>',
    '<span class="boot-message">32768K bytes of non-volatile configuration memory.</span>',
    '<span class="boot-message">4194304K bytes of physical memory.</span>',
    '<span class="boot-message">3207167K bytes of flash memory at bootflash:.</span>',
    '<span class="boot-message">0K bytes of WebUI ODM Files at webui:.</span>',
    '<span class="boot-message">\n\n\n</span>',
    '<span class="boot-message">\t   --- System Configuration Dialog ---</span>'
  ];

  function createIpSetting() {
    const setBox = document.createElement('div');
    setBox.className = "setting-box";
    
    const ipBox = document.createElement('div');
    ipBox.className = "ip";
    ipBox.id = "input";

    const subnetBox = document.createElement('div');
    subnetBox.className = "subnet";
    subnetBox.id = "input";
    
  }


  // --- 드래그 시작 ---
  for (let btn of buttons) {
    btn.addEventListener('mousedown', event => {
      const img = btn.querySelector('img');
      if (!img) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'topology-wrapper';
      wrapper.style.position = 'absolute';
      wrapper.style.zIndex = 1000;
      wrapper.style.pointerEvents = 'none';
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';

      const cloneImg = img.cloneNode();
      
      cloneImg.style.width = '80px';
      cloneImg.style.height = '80px';
      cloneImg.style.objectFit = 'contain';

      wrapper.appendChild(cloneImg);
      topology_inner.appendChild(wrapper);


      requestAnimationFrame(() => { //랜더링 다음 시점부터 애니메이션 -> 부드러운 애니메이션
        const frameRect = topology_frame.getBoundingClientRect();
        const ix = (event.clientX - frameRect.left + topology_frame.scrollLeft) / scale;
        const iy = (event.clientY - frameRect.top + topology_frame.scrollTop) / scale;
        const hw = wrapper.offsetWidth / 2;
        const hh = wrapper.offsetHeight / 2;

        wrapper.style.left = `${ix - hw}px`;
        wrapper.style.top = `${iy - hh}px`;
        wrapper.style.cursor = 'grabbing';

        clone = wrapper;
        is_dragging = true;
        dragg_default_name = btn.id;
        dragg_default_type = btn.id;
      });
    });
  }

  let startTime = Date.now();
  let offset = 0; // skip / back 시간 보정용
  const timeDisplay = document.getElementById('time-shower');

  function formatTime(seconds) {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `Time:  ${hrs}:${mins}:${secs}`;
  }

  function updateTime() {
    const now = Date.now();
    const elapsed = Math.floor((now - startTime) / 1000) + offset;
    timeDisplay.textContent = formatTime(Math.max(elapsed, 0));
  }

  // 1초마다 갱신
  setInterval(updateTime, 1000);

  // 버튼 핸들러
  document.getElementById('skip').addEventListener('click', () => {
    offset += 10;
    updateTime();
  });

  document.getElementById('back').addEventListener('click', () => {
    const now = Date.now();
    const elapsed = Math.floor((now - startTime) / 1000) + offset;
    if(elapsed >= 10) {
      offset -= 10; 
    }
    else {
      offset = -Math.floor((now - startTime) / 1000);
    }
    updateTime();
  });

  // --- 탭 여닫이 기능 ---
  const tap = document.getElementById('top-bar');
  const tapToggleBtn = document.getElementById('tap-updown');

  // 버튼 텍스트들 상태에 맞게 설정
  function updateTapButtonText() {
    const display = window.getComputedStyle(tap).display;
    if(display === 'none') {
      tapToggleBtn.textContent = 'Tap Open';
    } else {
      tapToggleBtn.textContent = 'Tap Down';
    }
  }

  // 페이지 처음 로딩 시 초기 버튼 문구 설정
  updateTapButtonText();

  // 클릭 시 여닫기 + 버튼 문구 업데이트
  tapToggleBtn.addEventListener('click', () => {
    const currentDisplay = window.getComputedStyle(tap).display;
    if (currentDisplay === 'none') {
      tap.style.display = 'flex';
    } else {
      tap.style.display = 'none';
    }
    updateTapButtonText();
  });

  

  // CLI / Topology / Problem 전환
  const cliBtn = document.getElementById('cli');
  const topologyBtn = document.getElementById('topology');
  const problemBtn = document.getElementById('problem');

  const cliBox = document.getElementById('cli-container');
  const problemBox = document.getElementById('problem-box');
  const topologybox = document.getElementById('Device-box'); 

  cliBtn.addEventListener('click', () => {
    problemBox.style.display = 'none';
    topologybox.style.display = 'none';

    // 모든 CLI 숨김
    document.querySelectorAll('#cli-container > .cli-box').forEach(cli => {
      cli.style.display = 'none';
    });

    // 현재 선택된 CLI 보여주기
    if (selectedDeviceId) {
      const targetCLI = document.querySelector(`.cli-box[data-target="${selectedDeviceId}"]`);
      if (targetCLI) {
        targetCLI.style.display = 'flex';
        const cliInput = targetCLI.querySelector('.cli-input');
        if (cliInput) cliInput.focus();
      }
    }
    cliBox.style.display = 'flex';
  });

  topologyBtn.addEventListener('click', () => {
    document.querySelectorAll('#cli-container > .cli-box').forEach(cli => {
      cli.style.display = 'none';
    });
    problemBox.style.display ='none';
    cliBox.style.display = 'none';
    topologybox.style.display = 'block';
  });

  problemBtn.addEventListener('click', () => {
    document.querySelectorAll('#cli-container > .cli-box').forEach(cli => {
      cli.style.display = 'none';
    });
    problemBox.style.display = 'block';
    cliBox.style.display = 'none';
    topologybox.style.display = 'none';
  });


  // 탭 활성화 유지 기능 추가
  const tabs = document.querySelectorAll('#tap .tap');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // 토폴로지 기기 전환
  const NDbox = document.getElementById("device-nd");
  const EDbox = document.getElementById("device-ed");
  const CNbox = document.getElementById("device-cn");

  const NDBtn = document.getElementById('nd');
  const EDBtn = document.getElementById('ed');
  const CNBtn = document.getElementById('cn');

  NDBtn.addEventListener('click', () => {
    NDbox.style.display = 'flex';
    EDbox.style.display = 'none';
    CNbox.style.display = 'none';
  });

  EDBtn.addEventListener('click', () => {
    NDbox.style.display = 'none';
    EDbox.style.display = 'flex';
    CNbox.style.display = 'none';
  });

  CNBtn.addEventListener('click', () => {
    NDbox.style.display = 'none';
    EDbox.style.display = 'none';
    CNbox.style.display = 'flex';
  });
});


// --------------------------------------------------------------