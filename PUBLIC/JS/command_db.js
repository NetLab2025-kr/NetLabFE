function hasSubkey(obj,key){
    return Object.values(obj).some(child => 
        child && typeof child === 'object' && key in child
    );
}

function addNo(obj){ //노 붙여주노
    return (obj.enable===true)?'':'no ';
}

function spacing(str){
    return (str.includes('_'))?' ':'';
}

function clear_arr(array){
    array.length = 0;
    return true;
}

function ipToInt(ip) {
    return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
}

function isIPInNetwork(ip, mask, networkAddr) {
    const ipNum = ipToInt(ip);
    const maskNum = ipToInt(mask);
    const netNum = ipToInt(networkAddr);

    return (ipNum & maskNum) === (netNum & maskNum);
}



const commands = {
    ['no']:{
        commandName:'no',
        description:'discard changes',
        options:{
            ['shutdown']:{
                name:'shutdown',
                description:'discard shutdown',
                
                run:function({config}){
                    const current_interface = config.CLI_Category.split(':')[1];
                    console.log(current_interface);
                    config.Interface[current_interface].shutdown = false;

                    const Table_obj = {
                        destination: config.Interface[current_interface].ip_address,
                        mask: config.Interface[current_interface].subnet_mask,
                        next_hop: '0.0.0.0', 
                        interface: current_interface,
                        source: "Directly connected",
                        code:"C",
                        etc:'',
                        metric: ''
                    };

                    console.log(Table_obj);

                    config.Datas.routingTable.push(Table_obj);
                    return {action:'none'};
                }
            },

            ['ip address']:{
                name:'ip address',
                description:'discard ip setting',

                run:function({config}){
                    const current_interface = config.Interface[config.CLI_Category.split(':')[1]];
                    current_interface.ip_address = '';
                    current_interface.subnet_mask = '';
                }
            },


            ['ip route']:{
                name:'ip route',
                description:'discard route change',
                run:function({config,commandLine}){
                    if(commandLine.length < 32 || commandLine.split(' ').length - 1 < 5){
                            return {action:'print_CLI',value:'% Invalid input detected'};
                        }

                    const target = commandLine.slice(12);
                    const splited = target.split(' ');
                    const routes = config.Route.static.routes;
                    const index = routes.indexOf({dest:splited[0],subnet:splited[1],next_hop:splited[2]})

                    if(index === -1){
                        return {action:'print_CLI',value:'%Inconsistent address and mask'};
                    }else{
                        routes.splice(index,1);
                        return {action:'none'};
                    }
                }
            },

            ['description']:{
                name:'description',
                description:'discard interface description',
                run:function({config}){
                    const it = config.Interface[config.CLI_Category.split(':')[1]];
                    it['description'] = '';
                    return {action:'none'};
                }
            },

            ['hostname']:{
                name:'hostname',
                description:'discard hostname change',
                run:function({config}){
                    const it = config.hostname;
                    it = '';
                    return {action:'none'};
                }
            },

            ['enable']:{
                name:'enable',
                description:'discard secret change',
                run:function({config,commandLine}){
                    //no enable secret
                    if(commandLine.length < 16){
                        return {action:'print_CLI',value:'% Invalid input detected'};
                    }
                    
                    const it = config.deviceSetting['enable_secret'];
                    it.enable = false;
                    it.encrypted = 0;
                    it.value = '';
                }
            },

            ['router']:{
                name:'router',
                description:'shutdown router config',
                run:function({config,commandLine}){
                    const route = config.Route;
                    const routing_table = config.Datas.routingTable;
                    const protocol = commandLine.split(' ')[2];
                    const prefix = commandLine.split(' ')[3];

                    if(protocol == "rip"){
                        route['rip'].enable = false;
                        route['rip'].version = 1;
                        route['rip'].autosummary = true;
                        
                        clear_arr(route['rip']['passive-interface']);
                        clear_arr(route['rip']['redistribute']);
                        clear_arr(route['rip']['network']);

                        routing_table = routing_table.filter(it => it.code == 'R');
                    }
                    else if(protocol == 'ospf'){
                        if(route['ospf'][prefix]){
                            delete route['ospf'][prefix];
                            routing_table = routing_table.filter(it => it.code == 'O'&&it.etc==prefix);
                        }
                        
                        return {acton:'none'};
                    }
                    else if(protocol == 'eigrp'){
                        if(route['eigrp'][prefix]){
                            delete route['eigrp'][prefix];
                            routing_table = routing_table.filter(it => it.code == 'D'&&it.etc==prefix);
                        }

                        return {action:'none'};
                    }
                    else if(protocol == 'bgp'){
                        if(route['bgp'][prefix]){
                            delete route['bgp'][prefix];
                            routing_table = routing_table.filter(it => it.code == 'B'&&it.etc==prefix);
                        }

                        return {action:'none'};
                    }
                }
            },

            
        }
    },

    ['show']:{
        commandName:'show',
        description:'showing something in CLI',
        options:{
            ['running-config']:{
                name:'running-config',description:'show running-config file contents',run:function({config}){ //config:장비 설정파일
                    let output = [];

                    // ip, ipv6
                    if (config.ip?.enable && config.ip.value === "cef") output.push("ip cef");
                    if (!config.ipv6?.enable && config.ipv6.value === "cef") output.push("no ipv6 cef");

                    output.push("!");

                    // Spanning Tree
                    if (config["spanning-tree"]?.enable) {
                        const stp = config["spanning-tree"];
                        if (stp.mode?.enable) {
                            if (stp.mode.pvst?.enable) output.push("spanning-tree mode pvst");
                            else if (stp.mode["rapid-pvst"]?.enable) output.push("spanning-tree mode rapid-pvst");
                        }
                    }

                    output.push("!");

                    // Interfaces
                    const interfaces = config.Interface;
                    for (const [iface, setting] of Object.entries(interfaces)) {
                        output.push(`interface ${iface}`);
                        if (!setting.ip_address) output.push(" no ip address");
                        output.push(" duplex auto");
                        output.push(" speed auto");
                        if (setting.shutdown) output.push(" shutdown");
                        output.push("!");
                    }

                    // 기본 라우팅 설정
                    output.push("ip classless");
                    output.push("!");
                    output.push("ip flow-export version 9");
                    output.push("!");

                    // line console
                    const con = config.line?.console?.[0];
                    if (con) {
                        output.push("line con 0");
                        if (con.logging_synchronous?.enable) output.push(" logging synchronous");
                        if (Array.isArray(con.exec_timeout)) {
                            output.push(` exec-timeout ${con.exec_timeout[0]} ${con.exec_timeout[1]}`);
                        }
                        output.push("!");
                    }

                    // line aux
                    output.push("line aux 0");
                    output.push("!");

                    // line vty
                    const vty = config.vty;
                    if (vty) {
                        output.push(`line vty ${vty.range[0]} ${vty.range[1]}`);
                        if (vty.login?.enable) output.push(" login");
                        if (Array.isArray(vty.exec_timeout)) {
                            output.push(` exec-timeout ${vty.exec_timeout[0]} ${vty.exec_timeout[1]}`);
                        }
                        if (Array.isArray(vty.transport_input)) {
                            output.push(` transport input ${vty.transport_input.join(" ")}`);
                        }
                        output.push("!");
                    }

                    output.push("!");
                    output.push("end");

                    return {action:'print_CLI',value:output.join('\n')};
                }
            },

            ['ip interface brief']:{
                name: 'ip interface brief',
                description: 'Shows interface brief info',
                run: function({ config }) {
                    const interfaces = config.Interface;
                    let output = "Interface\tIP-Address\tOK?\tMethod\tStatus\tProtocol\n";
                    for (const [iface, setting] of Object.entries(interfaces)) {
                    const ip = setting.ip_address || "unassigned";
                    const status = setting.shutdown ? "administratively down" : "up";
                    const protocol = setting.shutdown ? "down" : "up";
                    output += `${iface}\t${ip}\tYES\tmanual\t${status}\t${protocol}\n`;
                    }
                    return {action:'print_CLI',value:output};
                }
            },

            ['vlan']: {
                name: 'vlan',
                description: 'show vlan configuration',
                run: function({ config }) {
                    const datas = config.Datas;
                    const vlanInterfaces = datas.Vlans;

                    let output = "";
                    output += "VLAN Name                             Status    Ports\n";
                    output += "---- -------------------------------- --------- -------------------------------\n";

                    for(const obj in vlanInterfaces){
                        output += `${String(obj.number).padEnd(4,' ')}${String(obj.type).padEnd(15,' ')}${String(obj.status).padEnd(9,' ')}`;

                        let sum = [];
                        for(const ports in obj.ports){
                            if(sum.length >= 3){
                                for(let i=0;i<3;i++) sum.pop();
                                output += `                             \n`;
                            }
                            output += `${ports}, `
                            sum.push(ports);
                        }
                    }
                    output += "\n";

                    return {action:'print_CLI',value:output};
                }
            },

            ['ip route']:{
                name:'ip route',
                description:'showing ip routing table',
                run:function({config}){
                    const datas = config.Datas.routingTable;
                    let output = `Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP\n`;
                    output += `       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area\n`;
                    output += `       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2\n`;
                    output += `       E1 - OSPF external type 1, E2 - OSPF external type 2, E - EGP\n`;
                    output += `       i - IS-IS, L1 - IS-IS level-1, L2 - IS-IS level-2, ia - IS-IS inter area\n`;
                    output += `       * - candidate default, U - per-user static route, o - ODR\n`;
                    output += `       P - periodic downloaded static route\n\n`;
                    

                    if(config.Datas.defaultGateway === 'not set'){
                        output += `Gateway of last resort is not set\n\n`;
                    }

                    /*

                    const Table_obj = {
                        destination: config.Interface[current_interface].ip_address,
                        mask: config.Interface[current_interface].subnet_mask,
                        next_hop: '', 
                        interface: current_interface,
                        source: "Directly connected",
                        code:"C",
                        etc:'',
                        metric: ''
                    };
                    
                    */

                    for(const data of datas){
                        output += String(data.code).padEnd(8,' ');
                        let prefix = 0;
                        for(const octet of String(data.mask).split('.')){
                            let binary = parseInt(octet, 10).toString(2);
                            prefix += binary.split('1').length - 1;
                        }
                        console.log(`data is ${data}`);
                        output += `${data.destination}/${prefix} is ${data.source}, ${data.interface} (${data.etc})[${data.metric}]\n`;
                    }

                    return {action:'print_CLI',value:output};
                }
            }
        }
    },

    ['interface']:{
        commandName:'interface',
        description:'Select an interface to configure',
        options:{
            ['gigabitEthernet[slot/port]']:{
                name:'gigabitEthernet',
                description:'GigabitEthernet IEEE 802.3z',
                run:function({config,commandLine}){
                    if(commandLine.split(' ').length - 1 == 2){
                        commandLine = commandLine.split(' ')[2];
                    }
                    else{
                        commandLine = commandLine.split(' ')[1];
                    }


                    for(const character of commandLine){
                        if(character === '/'||(!isNaN(character) && character.trim() !== '')){
                            continue;
                        }
                        else{
                            commandLine = commandLine.replaceAll(character,'');
                        }
                    }

                    if(`GigabitEthernet${commandLine}` in config.Interface){
                        config.CLI_Category =  `interface:GigabitEthernet${commandLine}`;
                        return {action:'none'};
                    }else{
                        return {action:'print_CLI',value:`GigabitEthernet${commandLine} is not found!`};
                    }
                }
            },

            ['FastEthernet[slot/port]']:{
                name:'FastEthernet',
                description:'FastEthernet IEEE 802.3',
                run:function({config,commandLine}){
                    if(commandLine.split(' ').length - 1 == 2){
                        commandLine = commandLine.split(' ')[2];
                    }
                    else{
                        commandLine = commandLine.split(' ')[1];
                    }


                    for(const character of commandLine){
                        if(character === '/'||(!isNaN(character) && character.trim() !== '')){
                            continue;
                        }
                        else{
                            commandLine = commandLine.replaceAll(character,'');
                        }
                    }


                    if(`FastEthernet${commandLine}` in config.Interface){
                        config.CLI_Category = `interface:FastEthernet${commandLine}`;
                        return {action:'none'};
                    }else{
                        return {action:'print_CLI',value:`FastEthernet${commandLine} is not found!`};
                    }
                }
            },

            ['Vlan[num]']:{
                name:'Vlan',
                description:'Catalyst Vlans',

                run:function({config,commandLine}){
                    if(commandLine.split(' ').length - 1 == 2){
                        commandLine = commandLine.split(' ')[2];
                    }
                    else{
                        commandLine = commandLine.split(' ')[1];
                    }


                    for(const character of commandLine){
                        if((!isNaN(character) && character.trim() !== '')){
                            continue;
                        }
                        else{
                            commandLine = commandLine.replaceAll(character,'');
                        }
                    }


                    if(`Vlan${commandLine}` in config.Interface){
                        config.CLI_Category = `interface:Vlan${commandLine}`;
                        
                    }else{
                        config.Interface[`Vlan${commandLine}`] = {description:'',shutdown:true,ip_address:'',subnet_mask:''}
                    }
                    return {action:'none'};
                }
            },

            ['Serial']:{
                name:'Serial',
                description:'Serial',
                
                run:function({config,commandLine}){
                    if(commandLine.split(' ').length - 1 == 2){
                        commandLine = commandLine.split(' ')[2];
                    }
                    else{
                        commandLine = commandLine.split(' ')[1];
                    }


                    for(const character of commandLine){
                        if((!isNaN(character) && character.trim() !== '')){
                            continue;
                        }
                        else{
                            commandLine = commandLine.replaceAll(character,'');
                        }
                    }


                    if(`Serial${commandLine}` in config.Interface){
                        config.CLI_Category = `interface:Serial${commandLine}`;
                        return {action:'none'};
                    }else{
                        return {action:'print_CLI',value:`Serial${commandLine} is not found!`};
                    }
                }
            }
        }
    },

    ['shutdown']:{
        commandName:'shutdown',
        description:'shutdown Interface',
        options:{
            ['NONE']:{
                name:"none",
                description:'',

                run:function({config}){
                    const current_interface = config.CLI_Category.split(':')[1];
                    Interface[current_interface].shutdown = true;
                    return {action:'none'};
                }
            }
        }
    },

    ['ip']:{
        commandName:'ip',
        description:'Interface Internet Protocol config commands',
        options:{
            ['address']:{
                name:'address',
                description:'Set the IP address of an interface',

                run:function({config,commandLine}){
                    const ip_address = commandLine.split(' ')[2];
                    const subnet_mask = commandLine.split(' ')[3];

                    const it = config.Interface[config.CLI_Category.split(':')[1]];
                    it['ip_address'] = ip_address;
                    it['subnet_mask'] = subnet_mask;

                    return {action:'none'};
                }
            },

            ['route']:{
                name:'route',
                description:'Establish static routes',

                run:function({config,commandLine}){
                    const static_routing = config.Route.static;
                    static_routing.enable = true;

                    const line_subneted = commandLine.split(' ');
                    const dest_ip = line_subneted[2];
                    const subnet_mask = line_subneted[3];
                    const next_dest = line_subneted[4];

                    const obj ={dest:dest_ip,subnet:subnet_mask,next_hop:next_dest};
                    if(static_routing.routes.includes(obj)){
                        return {action:'none'};
                    }

                    const Table_obj = {
                        destination: dest_ip,
                        mask: subnet_mask,
                        next_hop: next_dest, 
                        interface: " ",
                        source: "static",
                        code:"S",
                        etc:'',
                        metric: ''
                    };

                    config.Datas.routingTable.push(Table_obj);
                    static_routing.routes.push(obj);
                    return {action:'none'};
                }
            }
        }
    },

    ['description']:{
        commandName:'description',
        description:'Interface specific description',
        options:{
            ['LINE']:{ //줄글
                name:'LINE',
                description:'Up to 240 characters describing this interface',
                run:function({config,commandLine}){
                    const description_value = commandLine.split(' ')[1];
                    const it = config.Interface[config.CLI_Category.split(':')[1]];
                    if(description_value.length > 240){
                        return {action:'print_CLI',value:'Too Long...'};
                    }

                    it['description'] = description_value;

                    return {action:'none'};
                }
            }
        }
    },

    ['hostname']:{
        commandName:'hostname',
        description:"Set system's network name",
        options:{
            ['LINE']:{
                name:'LINE',
                description:"This system's network name",
                run:function({config,commandLine}){
                    const hostname_value = commandLine.split(' ')[1];
                    if(hostname_value > 10){
                        return {action:'print_CLI',value:'too long;;;'};
                    }
                    let it = config.hostname;
                    it = hostname_value;
                    return {action:'none'};
                }
            }
        }
    },

    ['exit']:{
        commandName:'exit',
        description:'Exit from current mode',
        options:{
            ['NONE']:{
                name:"none",
                description:'',
                run:function({config}){
                    if(config.CLI_Category === "global config"){
                        config.CLI_Category = "previlige";
                    }
                    else if(config.CLI_Category === "previlige"){
                        config.CLI_Category = "user";
                    }
                    else if(config.CLI_Category.split(':')[0] === "interface"){
                        config.CLI_Category = "global config";
                    }
                    else if(config.CLI_Category.split(':')[0] === "router"){
                        config.CLI_Category = "global config";
                    }

                    return {action:'none'};
                }
            }
        }
    },

    ['enable']:{
        commandName:'enable',
        description:'enabling',
        options:{
            ['NONE']:{
                name:'NONE',
                description:'',
                run:function({config}){
                    config.CLI_Category = "previlige";
                    return {action:'none'};
                }
            },

            ['password']:{
                name:'password',
                description:'Assign the privileged level password',
                run:function({config,commandLine}){
                    config.deviceSetting['enable_secret'].enable = true;
                    config.deviceSetting['enable_secret'].encrypted = 0;
                    config.deviceSetting['enable_secret'].value = commandLine.split(' ')[2];

                    return {action:'none'};
                }
            },

            ['secret']:{
                name:'secret',
                description:'Assign the privileged level secret',
                run:async function({config,commandLine}){
                    config.deviceSetting['enable_secret'].enable = true;
                    config.deviceSetting['enable_secret'].encrypted = 5;

                    const data = new TextEncoder().encode(commandLine.split(' ')[2]);
                    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
                    const hashArr = Array.from(new Uint8Array(hashBuffer));
                    const hashHex = hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
                    config.deviceSetting['enable_secret'].value = hashHex;

                    return {action:'none'};
                }
            },
        }
    },

    ['configure']:{
        commandName:'configure',
        description:'configure anything you want!',
        options:{
            ['terminal']:{
                name:'terminal',
                description:'configure terminal!',
                run:function({config}){
                    config.CLI_Category = "global config";
                    return {action:'none'};
                }
            }
        }
    },

    ['router']:{
        commandName:'router',
        description:'Enable a routing process',
        options:{
            ['rip']:{
                name:'rip',
                description:'routing protocol:rip',
                run:function({config}){
                    const route = config.Route.rip;
                    if(!route.enable) route.enable = true;

                    config.CLI_Category = 'router:rip';
                    return {action:'none'};
                }
            },

            ['ospf']:{
                name:'ospf',
                description:'routing protocol:ospf',
                run:function({config,commandLine}){
                    const route = config.Route.ospf;
                    const processID = commandLine.split(' ')[2];

                    if(parseInt(processID) > 65535 || parseInt(processID) < 1){
                        return {acton:'print_CLI',value:'Invalid input detected'};
                    }
                    if(!route.enable) route.enable = true;

                    config.CLI_Category = `router:ospf${processID}`;
                    route[processID] = {autocost:true,['passive-interface']:[],['redistribute']:[],network:{}};
                    return {action:'none'};
                }
            },

            ['eigrp']:{
                name:'eigrp',
                description:'routing protocol:eigrp',
                run:function({config,commandLine}){
                    const route = config.Route.eigrp;
                    const asNumber = commandLine.split(' ')[2];

                    if(parseInt(asNumber) > 65535 || parseInt(asNumber) < 1){
                        return {acton:'print_CLI',value:'Invalid input detected'};
                    }
                    if(!route.enable) route.enable = true;

                    config.CLI_Category = `router:eigrp${asNumber}`;
                    route[asNumber] = {autosummary:true,['passive-interface']:[],['redistribute']:[],network:{}};

                    return {action:'none'};
                }
            },

            ['bgp']:{
                name:'bpg',
                description:'routing protocol:bgp',
                run:function({config,commandLine}){
                    const route = config.Route.bgp;
                    const asNumber = commandLine.split(' ')[2];

                    if(parseInt(asNumber) > 65534 || parseInt(asNumber) < 1){
                        return {acton:'print_CLI',value:'Invalid input detected'};
                    }
                    if(!route.enable) route.enable = true;

                    config.CLI_Category = `router:bgp${asNumber}`;
                    route[asNumber] = {neighbors:{},netwokrs:{}};
                    return {action:'none'};
                }
            }
        }
    },

    // 라우팅
    ['network']:{
        commandName:'network',
        description:'Enable routing on an IP network',
        options:{
            ['LINE']:{
                name:'LINE',
                description:'Routing Information',
                run:function({config,commandLine,object}){
                    const current_Protocol = config.CLI_Category.split(':')[1];

                    if(current_Protocol == "rip"){
                        const target_ip_add = commandLine.split(' ')[1];

                        for(let ifaceName in config.Interface){
                            let iface = config.Interface[ifaceName];
                            if(!iface.shutdown && isIPInNetwork(iface.ip_address,iface.subnet_mask,target_ip_add)){
                                iface.ripEnabled = true;
                            }
                        }

                        if(!config.Route.rip.intervalExist){
                            setInterval(() => {
                                object.sendRipUpdate();
                            }, 30000);
                        }

                        return {action:'none'};
                    }
                }
            }
        }
    },

    ['ping']:{
        commandName:'ping',
        description:'ping to other network',
        options:{
            ['LINE']:{
                name:'LINE',
                description:'other network',
                run:async function({commandLine,object}){
                    const destIP = commandLine.split(' ')[1];
                    const output = await object.sendPacket(destIP,{ msg: "none" });

                    return {action:'print_CLI',value:'Ping to [${destIP}] is Successful'};

                    if(output.status == 'next_hop_not_found' || output.status == 'no_route'){
                        return {action:'print_CLI',value:'Host [${destIP}] is unreachable'};
                    }else if(output.status == 'processed'){
                        return {action:'print_CLI',value:'Ping to [${destIP}] is Successful'};
                    }
                }
            }
        }
    }
}

export default commands;