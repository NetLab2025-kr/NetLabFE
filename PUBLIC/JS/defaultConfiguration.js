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
            },

            ['GigabitEthernet0/0/1']:{
                description:'',
                shutdown:true,
                ip_address:'',
                subnet_mask:'',
                mac_address:'',
            },

            ['GigabitEthernet0/0/2']:{
                description:'',
                shutdown:true,
                ip_address:'',
                subnet_mask:'',
                mac_address:'',
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
    }
}

export default config;