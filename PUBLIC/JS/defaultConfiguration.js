//이곳은 응디시티
//만일 value가 있으면 다음 arg에 값이 존재(string이든 bool이든 int든)

const config = {
    Router:{
        category:'Router',
        version:0.1,
        hostname:'',
        ip:{enable:true,value:'cef'},
        ipv6:{enable:false,value:'cef'},
        CLI_Category:'user', //user, previlige, global config, interface:인터페이스 이름, router:프로토콜 이름

        ['spanning-tree']:{
            enable:true,
            ['mode']:{
                enable:true, //켜져 있는지
                ['pvst']:{enable:true},
                ['rapid-pvst']:{enable:false},
            },

            ['portfast']:{
                enable:false,
                ['bpduguard'] : {
                    enable:false,
                    ['default']:{enable:false},
                },

                ['default']:{enable:false}
            },

            ['vlan']:{
                enable:false,

                value:-1,

                ['priority']:{
                    enable:false,
                    value:-1,
                },

                ['root']:{
                    enable:false,
                    ['primary']:{enable:false},
                    ['secondary']:{enable:false} //꺼져있다는 뜻
                }
            }
        },

        deviceSetting:{
            ['enable_secret']:{enable:false,encrypted:0,value:''},//encrypted 0: un, 5:crypted
            banner:'',

        },

        service:{
            password_encryption:{enable:false},
        },

        Interface:{
            ['GigabitEthernet0/0/0']:{
                description:'',
                shutdown:true,
                ip_address:'',
                subnet_mask:'',
                mac_address:'',
                ripEnable: false
            },

            ['GigabitEthernet0/0/1']:{
                description:'',
                shutdown:true,
                ip_address:'',
                subnet_mask:'',
                mac_address:'',
                ripEnable: false
            },

            ['GigabitEthernet0/0/2']:{
                description:'',
                shutdown:true,
                ip_address:'',
                subnet_mask:'',
                mac_address:'',
                ripEnable: false
            },

            ['Vlan1']:{
                description:'',
                shutdown:true,
                ip_address:'',
                subnet_mask:'',
            }
        },

        Route:{
            static:{
                enable:false,
                routes:[
                    //{dest:'',subnet:'',next_hop:''}
                ],
            },

            rip:{
                enable:false,
                version:1,
                autosummary:true,
                intervalExist: false,
                ['passive-interface']:[],
                ['redistribute']:[],//아마 라우팅 프로토콜 이름들이 들어갈거임 예시(ospf 1, eigrp 7 등등)

                network:[],
            },

            ospf:{
                enable:false,
                /*[프로세스 ID]:{
                    autocost:true,
                    ['passive-interface']:[],
                    ['redistribute']:[],

                    network:{
                        ['네트워크 주소']:{wild_card:'',area:0},
                    }
                }*/
            },

            eigrp:{
                enable:false,
                /*[as넘버]:{
                    autosummary:true,
                    ['passive-interface']:[],
                    ['redistribute']:[],
                    
                    network:{
                        ['네트워크 주소']:{wild_card:''},
                    }
                }*/
            },

            bgp:{
                enable:false,

                /*[0]:{
                    neighbors:{
                        ['ip 주소']:{
                            remote_as:0,
                            description:'?',
                            "update_source": "loopback0",
                            "password": "cisco123",
                            "established": false,
                        }
                    },
                    networks:{
                        ['prefix']:{mask:''},
                    }
                }*/
            },
        },

        line:{
            console:{
                [0]:{ //default
                    password:{enable:false,value:''},
                    login:{enable:false},
                    exec_timeout:[5,0],//5분 0초
                    logging_synchronous: {enable:true},
                },
            }
        },

        vty:{
            range:[0,4],
            password:{enable:false,value:''},
            login:{enable:false},
            transport_input: ["ssh","telnet"],
            exec_timeout: [10,0]//10분 0초
        },

        Datas:{
            defaultGateway:'not set',
            routingTable:[
                /*Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
                    D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area
                    N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2
                    E1 - OSPF external type 1, E2 - OSPF external type 2, E - EGP
                    i - IS-IS, L1 - IS-IS level-1, L2 - IS-IS level-2, ia - IS-IS inter area
                    * - candidate default, U - per-user static route, o - ODR
                    P - periodic downloaded static route
                */
                /*{
                    destination: "192.168.1.0",
                    mask: "255.255.255.0",
                    next_hop: "0.0.0.0", 
                    interface: "GigabitEthernet0/0/0",
                    source: "Directly connected",
                    code:"C",
                    etc:'as넘버라든지 프로세스 아이디라던지',
                    metric: 0
                },*/
            ],

            Vlans:[
                {
                    number:1,
                    type:'default',
                    status:true,
                    ports:[
                        
                    ]
                }
            ]
        }
     },

    Switch: {
        category: 'Switch',
        version: 0.1,
        hostname: '',
        ip: { enable: true, value: 'cef' },
        ipv6: { enable: false, value: 'cef' },
        CLI_Category: 'user', //user, privilege, global config, interface:인터페이스 이름

        ['spanning-tree']: {
            enable: true,
            ['mode']: {
                enable: true, //켜져 있는지
                ['pvst']: { enable: true },
                ['rapid-pvst']: { enable: false },
                ['mst']: { enable: false }, // Multiple Spanning Tree
            },

            ['portfast']: {
                enable: false,
                ['bpduguard']: {
                    enable: false,
                    ['default']: { enable: false },
                },
                ['default']: { enable: false }
            },

            ['vlan']: {
                enable: false,
                value: -1,

                ['priority']: {
                    enable: false,
                    value: -1,
                },

                ['root']: {
                    enable: false,
                    ['primary']: { enable: false },
                    ['secondary']: { enable: false } //꺼져있다는 뜻
                }
            }
        },

        deviceSetting: {
            ['enable_secret']: { enable: false, encrypted: 0, value: '' }, //encrypted 0: un, 5:crypted
            banner: '',
        },

        service: {
            password_encryption: { enable: false },
        },

        Interface: {
            ['FastEthernet0/1']: {
                description: '',
                shutdown: false, // 스위치 포트는 기본적으로 활성화
                switchport: {
                    mode: 'access', // access, trunk
                    access_vlan: 1,
                    trunk_allowed_vlans: 'all',
                    trunk_native_vlan: 1,
                },
                ['port-security']: {
                    enable: false,
                    maximum: 1,
                    ['mac-address']: 'sticky',
                    violation: 'shutdown', // shutdown, restrict, protect
                },
                duplex: 'auto', // auto, full, half
                speed: 'auto', // auto, 10, 100, 1000
            },

            ['FastEthernet0/2']: {
                description: '',
                shutdown: false,
                switchport: {
                    mode: 'access',
                    access_vlan: 1,
                    trunk_allowed_vlans: 'all',
                    trunk_native_vlan: 1,
                },
                ['port-security']: {
                    enable: false,
                    maximum: 1,
                    ['mac-address']: 'sticky',
                    violation: 'shutdown',
                },
                duplex: 'auto',
                speed: 'auto',
            },

            ['FastEthernet0/3']: {
                description: '',
                shutdown: false,
                switchport: {
                    mode: 'access',
                    access_vlan: 1,
                    trunk_allowed_vlans: 'all',
                    trunk_native_vlan: 1,
                },
                ['port-security']: {
                    enable: false,
                    maximum: 1,
                    ['mac-address']: 'sticky',
                    violation: 'shutdown',
                },
                duplex: 'auto',
                speed: 'auto',
            },

            ['FastEthernet0/4']: {
                description: '',
                shutdown: false,
                switchport: {
                    mode: 'access',
                    access_vlan: 1,
                    trunk_allowed_vlans: 'all',
                    trunk_native_vlan: 1,
                },
                ['port-security']: {
                    enable: false,
                    maximum: 1,
                    ['mac-address']: 'sticky',
                    violation: 'shutdown',
                },
                duplex: 'auto',
                speed: 'auto',
            },

            // 추가 포트들...
            ['GigabitEthernet0/1']: {
                description: '',
                shutdown: false,
                switchport: {
                    mode: 'access',
                    access_vlan: 1,
                    trunk_allowed_vlans: 'all',
                    trunk_native_vlan: 1,
                },
                ['port-security']: {
                    enable: false,
                    maximum: 1,
                    ['mac-address']: 'sticky',
                    violation: 'shutdown',
                },
                duplex: 'auto',
                speed: 'auto',
            },

            ['GigabitEthernet0/2']: {
                description: '',
                shutdown: false,
                switchport: {
                    mode: 'access',
                    access_vlan: 1,
                    trunk_allowed_vlans: 'all',
                    trunk_native_vlan: 1,
                },
                ['port-security']: {
                    enable: false,
                    maximum: 1,
                    ['mac-address']: 'sticky',
                    violation: 'shutdown',
                },
                duplex: 'auto',
                speed: 'auto',
            },

            ['Vlan1']: {
                description: 'Management VLAN',
                shutdown: true,
                ip_address: '',
                subnet_mask: '',
            }
        },

        // 스위치는 기본적으로 라우팅 기능이 제한적이므로 간소화
        Route: {
            ['default-gateway']: {
                enable: false,
                gateway: '',
            },
        },

        line: {
            console: {
                [0]: { //default
                    password: { enable: false, value: '' },
                    login: { enable: false },
                    exec_timeout: [5, 0], //5분 0초
                    logging_synchronous: { enable: true },
                },
            }
        },

        vty: {
            range: [0, 15], // 스위치는 보통 더 많은 vty 라인을 가짐
            password: { enable: false, value: '' },
            login: { enable: false },
            transport_input: ["ssh", "telnet"],
            exec_timeout: [10, 0] //10분 0초
        },

        // VLAN 설정 (스위치의 핵심 기능)
        VLANs: {
            [1]: {
                name: 'default',
                status: 'active',
                type: 'enet',
            },
            // 추가 VLAN 설정 예시:
            // [10]: {
            //     name: 'Sales',
            //     status: 'active',
            //     type: 'enet',
            // },
            // [20]: {
            //     name: 'Engineering',
            //     status: 'active',
            //     type: 'enet',
            // },
        },

        // Port Channel (EtherChannel) 설정
        ['Port-Channel']: {
            // [1]: {
            //     mode: 'on', // on, active, passive, desirable, auto
            //     load_balance: 'src-dst-ip',
            //     members: ['FastEthernet0/1', 'FastEthernet0/2'],
            // },
        },

        Datas: {
            defaultGateway: 'not set',
            
            // MAC Address Table
            macTable: [
                /*{
                    vlan: 1,
                    mac_address: '0050.56c0.0001',
                    type: 'dynamic', // dynamic, static
                    port: 'FastEthernet0/1',
                    age: 300
                },*/
            ],

            // VLAN 포트 매핑
            vlanPorts: {
                1: ['FastEthernet0/1', 'FastEthernet0/2', 'FastEthernet0/3', 'FastEthernet0/4', 
                    'GigabitEthernet0/1', 'GigabitEthernet0/2'], // VLAN 1에 속한 포트들
                // 10: ['FastEthernet0/5', 'FastEthernet0/6'],
                // 20: ['FastEthernet0/7', 'FastEthernet0/8'],
            },

            // Spanning Tree 상태 정보
            spanningTreeInfo: {
                rootBridge: '',
                bridgePriority: 32769, // 32768 + VLAN ID
                bridgeID: '',
                portStates: {
                    // 'FastEthernet0/1': 'forwarding', // forwarding, blocking, learning, listening
                },
            },
        }
    },

    PC: {
        category: 'PC',
        version: 0.1,
        hostname: 'PC',
        os: 'Windows', // Windows, Linux, macOS
        CLI_Category: 'user', // user, administrator

        // 네트워크 어댑터 설정
        NetworkAdapter: {
            ['Ethernet0']: {
                name: 'Local Area Connection',
                description: 'Intel(R) PRO/1000 MT Desktop Adapter',
                enabled: true,
                connected: false, // 케이블 연결 상태
                
                // IPv4 설정
                ipv4: {
                    mode: 'dhcp', // dhcp, static
                    ip_address: '',
                    subnet_mask: '',
                    default_gateway: '',
                    preferred_dns: '',
                    alternate_dns: '',
                },

                // IPv6 설정
                ipv6: {
                    enable: false,
                    mode: 'auto', // auto, dhcp, static
                    ip_address: '',
                    prefix_length: 64,
                    default_gateway: '',
                    preferred_dns: '',
                    alternate_dns: '',
                },

                // 물리적 속성
                mac_address: '', // 자동 생성되거나 수동 설정
                speed: 'auto', // auto, 10Mbps, 100Mbps, 1000Mbps
                duplex: 'auto', // auto, half, full
                mtu: 1500,
            },

            // 추가 네트워크 어댑터 (Wi-Fi 등)
            ['WiFi0']: {
                name: 'Wireless Network Connection',
                description: 'Intel(R) Dual Band Wireless-AC 7260',
                enabled: false,
                connected: false,
                
                ipv4: {
                    mode: 'dhcp',
                    ip_address: '',
                    subnet_mask: '',
                    default_gateway: '',
                    preferred_dns: '',
                    alternate_dns: '',
                },

                ipv6: {
                    enable: false,
                    mode: 'auto',
                    ip_address: '',
                    prefix_length: 64,
                    default_gateway: '',
                    preferred_dns: '',
                    alternate_dns: '',
                },

                mac_address: '',
                // 무선 전용 설정
                wireless: {
                    ssid: '',
                    security: 'none', // none, wep, wpa, wpa2, wpa3
                    password: '',
                    signal_strength: 0, // 0-100
                },
            },
        },

        // 방화벽 설정
        Firewall: {
            enable: true,
            profiles: {
                domain: {
                    enable: true,
                    inbound_default: 'block',
                    outbound_default: 'allow',
                },
                private: {
                    enable: true,
                    inbound_default: 'block',
                    outbound_default: 'allow',
                },
                public: {
                    enable: true,
                    inbound_default: 'block',
                    outbound_default: 'allow',
                },
            },
            rules: [
                // 예시 규칙
                /*{
                    name: 'Allow HTTP',
                    direction: 'inbound',
                    action: 'allow',
                    protocol: 'tcp',
                    port: 80,
                    enable: true,
                },*/
            ],
        },

        // 서비스 및 애플리케이션
        Services: {
            ['web-server']: {
                enable: false,
                port: 80,
                document_root: 'C:\\inetpub\\wwwroot',
                default_page: 'index.html',
            },

            ['ftp-server']: {
                enable: false,
                port: 21,
                root_directory: 'C:\\ftproot',
                anonymous_access: false,
            },

            ['telnet-server']: {
                enable: false,
                port: 23,
                max_connections: 5,
            },

            ['ssh-server']: {
                enable: false,
                port: 22,
                protocol_version: 2,
            },

            ['dhcp-client']: {
                enable: true,
                lease_time: 86400, // 24시간
                renew_time: 43200, // 12시간
            },

            ['dns-client']: {
                enable: true,
                cache_timeout: 3600,
            },
        },

        // 사용자 계정
        Users: {
            ['Administrator']: {
                enable: true,
                password: '',
                groups: ['Administrators'],
                last_login: '',
            },

            ['Guest']: {
                enable: false,
                password: '',
                groups: ['Guests'],
                last_login: '',
            },

            // 사용자 정의 계정
            ['user']: {
                enable: true,
                password: '',
                groups: ['Users'],
                last_login: '',
            },
        },

        // 라우팅 테이블 (고급 사용자용)
        Route: {
            static: {
                enable: false,
                routes: [
                    // {dest: '192.168.2.0', mask: '255.255.255.0', gateway: '192.168.1.1', metric: 1}
                ],
            },
        },

        // 네트워크 진단 도구
        NetworkTools: {
            ping: {
                enable: true,
                default_count: 4,
                default_timeout: 4000, // ms
            },

            traceroute: {
                enable: true,
                max_hops: 30,
                timeout: 5000, // ms
            },

            nslookup: {
                enable: true,
                default_server: 'auto',
            },
        },

        // 시스템 데이터
        Datas: {
            // 네트워크 연결 정보
            connections: [
                /*{
                    local_address: '192.168.1.100',
                    local_port: 80,
                    remote_address: '192.168.1.1',
                    remote_port: 12345,
                    protocol: 'TCP',
                    state: 'ESTABLISHED',
                },*/
            ],

            // ARP 테이블
            arpTable: [
                /*{
                    ip_address: '192.168.1.1',
                    mac_address: '00:50:56:c0:00:01',
                    type: 'dynamic', // dynamic, static
                    interface: 'Ethernet0',
                },*/
            ],

            // DNS 캐시
            dnsCache: [
                /*{
                    name: 'www.google.com',
                    type: 'A',
                    data: '172.217.164.100',
                    ttl: 300,
                    timestamp: new Date().getTime(),
                },*/
            ],

            // 라우팅 테이블
            routingTable: [
                /*{
                    destination: '0.0.0.0',
                    mask: '0.0.0.0',
                    gateway: '192.168.1.1',
                    interface: 'Ethernet0',
                    metric: 25,
                    type: 'default',
                },
                {
                    destination: '192.168.1.0',
                    mask: '255.255.255.0',
                    gateway: '0.0.0.0',
                    interface: 'Ethernet0',
                    metric: 25,
                    type: 'direct',
                },*/
            ],

            // 네트워크 통계
            statistics: {
                bytes_sent: 0,
                bytes_received: 0,
                packets_sent: 0,
                packets_received: 0,
                errors_sent: 0,
                errors_received: 0,
                uptime: 0, // seconds
            },

            // 현재 네트워크 상태
            networkStatus: {
                primary_adapter: 'Ethernet0',
                internet_access: false,
                domain_joined: false,
                workgroup: 'WORKGROUP',
                computer_name: 'PC1',
            },

            // 로그 정보
            eventLog: [
                /*{
                    timestamp: new Date().toISOString(),
                    level: 'info', // info, warning, error
                    source: 'Network',
                    message: 'Network adapter connected',
                    event_id: 1001,
                },*/
            ],
        }
    }

}

export default config;