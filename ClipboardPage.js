import React, { useState, useRef, useEffect } from 'react';
import { FaCopy, FaCheck, FaChevronDown, FaChevronRight, FaEye, FaEyeSlash, FaDownload } from 'react-icons/fa';
import '../components/Clipboard/Clipboard.css';

const ClipboardPage = () => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedCodes, setExpandedCodes] = useState({});
  const [stealthMode, setStealthMode] = useState(true);
  const [showStealthIndicator, setShowStealthIndicator] = useState(false);
  const textAreaRef = useRef(null);

  // Handle keyboard shortcuts for stealth mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle stealth mode with Ctrl+Shift+A
      if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
        setStealthMode(prev => !prev);
        setShowStealthIndicator(true);
        setTimeout(() => setShowStealthIndicator(false), 2000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const copyToClipboard = (text, index) => {
    // Create a temporary textarea element to copy from
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed'; // Prevent scrolling to bottom
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      // Try the modern clipboard API first
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedIndex(index);
          setTimeout(() => setCopiedIndex(null), 2000);
        })
        .catch(() => {
          // Fallback to document.execCommand
          const successful = document.execCommand('copy');
          if (successful) {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
          } else {
            console.error('Failed to copy text');
          }
        });
    } catch (err) {
      // Final fallback
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopiedIndex(index);
          setTimeout(() => setCopiedIndex(null), 2000);
        } else {
          console.error('Failed to copy text');
        }
      } catch (err) {
        console.error('Failed to copy text', err);
      }
    } finally {
      // Clean up
      document.body.removeChild(textarea);
    }
  };

  const downloadCode = (text, index, type) => {
    // Determine file extension based on content type
    const fileType = type.includes('TCL') ? 'tcl' : 'awk';
    const filename = `${type.split(' - ')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.${fileType}`;
    
    // Create a blob with the code content
    const blob = new Blob([text], { type: 'text/plain' });
    
    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Append the link to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    window.setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  const toggleCodeExpansion = (index) => {
    setExpandedCodes(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const notebookData = [
    {
      type: 'markdown',
      content: '## Wired Network Simulation - TCL'
    },
    {
      type: 'code',
      content: `set ns [new Simulator]

set tracefile [open out.tr w]  
$ns trace-all $tracefile

set namfile [open out.nam w]  
$ns namtrace-all $namfile

set n0 [$ns node]  
set n1 [$ns node]  
set n2 [$ns node]

$ns duplex-link $n0 $n1 1Mb 10ms DropTail  
$ns duplex-link $n1 $n2 1Mb 10ms DropTail

$ns queue-limit $n0 $n1 10  
$ns queue-limit $n1 $n2 10

set tcp [new Agent/TCP]  
$ns attach-agent $n0 $tcp  
set sink [new Agent/TCPSink]  
$ns attach-agent $n2 $sink  
$ns connect $tcp $sink

set ftp [new Application/FTP]  
$ftp attach-agent $tcp  
$ftp set type_ FTP

$ns at 0.1 "$ftp start"  
$ns at 4.0 "$ftp stop"  
$ns at 5.0 "finish"

proc finish {} {  
    global ns tracefile namfile  
    $ns flush-trace  
    close $tracefile  
    close $namfile  
    exec nam out.nam &  
    exit 0  
}

$ns run`
    },
    {
      type: 'markdown',
      content: '## Wired Network Simulation - AWK'
    },
    {
      type: 'code',
      content: `BEGIN {  
    total_bytes = 0;  
    start_time = 0;  
    end_time = 0;  
}

# Capture the first packet send time  
$1 == "+" && start_time == 0 {  
    start_time = $2;  
}

# Capture the last packet receive time and accumulate the bytes received  
$1 == "r" {  
    total_bytes += $9;  # Assuming $8 is the size of the packet  
    end_time = $2;  
}

END {  
    duration = end_time - start_time;  
    if (duration > 0) {  
        throughput = (total_bytes * 8) / (duration * 1000000);  # Throughput in Mbps  
        print "Throughput: " throughput " Mbps";  
    } else {  
        print "No packets received.";  
    }  
}`
    },
    {
      type: 'markdown',
      content: '## Wireless Network Simulation - TCL'
    },
    {
      type: 'code',
      content: `set val(chan)           Channel/WirelessChannel    
set val(prop)           Propagation/TwoRayGround   
set val(netif)          Phy/WirelessPhy            
set val(mac)            Mac/802_11                 
set val(ifq)            Queue/DropTail/PriQueue    
set val(ll)             LL                         
set val(ant)            Antenna/OmniAntenna        
set val(ifqlen)         50                         
set val(nn)             6                          
set val(rp)             AODV                       
set val(x)  500   
set val(y)  500   

set ns [new Simulator]

set tracefile [open wireless.tr w]  
$ns trace-all $tracefile

set namfile [open wireless.nam w]  
$ns namtrace-all-wireless $namfile $val(x) $val(y)

set topo [new Topography]  
$topo load_flatgrid $val(x) $val(y)

create-god $val(nn)

set channel1 [new $val(chan)]  
set channel2 [new $val(chan)]  
set channel3 [new $val(chan)]

$ns node-config -adhocRouting $val(rp) \\
  -llType $val(ll) \\
  -macType $val(mac) \\
  -ifqType $val(ifq) \\
  -ifqLen $val(ifqlen) \\
  -antType $val(ant) \\
  -propType $val(prop) \\
  -phyType $val(netif) \\
  -topoInstance $topo \\
  -agentTrace ON \\
  -macTrace ON \\
  -routerTrace ON \\
  -movementTrace ON \\
  -channel $channel1 

set n0 [$ns node]  
set n1 [$ns node]  
set n2 [$ns node]  
set n3 [$ns node]  
set n4 [$ns node]  
set n5 [$ns node]

$n0 random-motion 0  
$n1 random-motion 0  
$n2 random-motion 0  
$n3 random-motion 0  
$n4 random-motion 0  
$n5 random-motion 0

$ns initial_node_pos $n0 20  
$ns initial_node_pos $n1 20  
$ns initial_node_pos $n2 20  
$ns initial_node_pos $n3 20  
$ns initial_node_pos $n4 20  
$ns initial_node_pos $n5 50

$n0 set X_ 10.0  
$n0 set Y_ 20.0  
$n0 set Z_ 0.0

$n1 set X_ 210.0  
$n1 set Y_ 230.0  
$n1 set Z_ 0.0

$n2 set X_ 100.0  
$n2 set Y_ 200.0  
$n2 set Z_ 0.0

$n3 set X_ 150.0  
$n3 set Y_ 230.0  
$n3 set Z_ 0.0

$n4 set X_ 430.0  
$n4 set Y_ 320.0  
$n4 set Z_ 0.0

$n5 set X_ 270.0  
$n5 set Y_ 120.0  
$n5 set Z_ 0.0  

$ns at 1.0 "$n1 setdest 490.0 340.0 25.0"  
$ns at 1.0 "$n4 setdest 300.0 130.0 5.0"  
$ns at 1.0 "$n5 setdest 190.0 440.0 15.0"  
$ns at 20.0 "$n5 setdest 100.0 200.0 30.0"

set tcp [new Agent/TCP]  
set sink [new Agent/TCPSink]  
$ns attach-agent $n0 $tcp  
$ns attach-agent $n5 $sink  
$ns connect $tcp $sink  
set ftp [new Application/FTP]  
$ftp attach-agent $tcp  
$ns at 1.0 "$ftp start"

set udp [new Agent/UDP]  
set null [new Agent/Null]  
$ns attach-agent $n2 $udp  
$ns attach-agent $n3 $null  
$ns connect $udp $null  
set cbr [new Application/Traffic/CBR]  
$cbr attach-agent $udp  
$ns at 1.0 "$cbr start"

$ns at 30.0 "finish"

proc finish {} {  
 global ns tracefile namfile  
 $ns flush-trace  
 close $tracefile  
 close $namfile  
 exit 0  
}

puts "Starting Simulation"  
$ns run`
    },
    {
      type: 'markdown',
      content: '## Wireless Network Simulation - AWK'
    },
    {
      type: 'code',
      content: `BEGIN {  
    seqno = -1;   
    droppedPackets = 0;  
    receivedPackets = 0;  
    count = 0;  
}  
{  
    #packet delivery ratio  
    if($4 == "AGT" && $1 == "s" && seqno < $6) {  
        seqno = $6;  
    } else if(($4 == "AGT") && ($1 == "r")) {  
        receivedPackets++;  
    } else if ($1 == "D" && $7 == "tcp" && $8 > 512){  
        droppedPackets++;   
    }

    #end-to-end delay  
    if($4 == "AGT" && $1 == "s") {  
        start_time[$6] = $2;  
    } else if(($7 == "tcp") && ($1 == "r")) {  
        end_time[$6] = $2;  
    } else if($1 == "D" && $7 == "tcp") {  
        end_time[$6] = -1;  
    }  
}  
    
END {   
    for(i=0; i<=seqno; i++) {  
        if(end_time[i] > 0) {  
            delay[i] = end_time[i] - start_time[i];  
        count++;  
        } else {  
            delay[i] = -1;  
        }  
    }

    for(i=0; i<count; i++) {  
        if(delay[i] > 0) {  
            n_to_n_delay = n_to_n_delay + delay[i];  
        }   
    }

    n_to_n_delay = n_to_n_delay/count;  
    print "\\n";  
    print "GeneratedPackets = " seqno+1;  
    print "ReceivedPackets = " receivedPackets;  
    print "Packet Delivery Ratio = " receivedPackets/(seqno+1)*100"%";  
    print "Total Dropped Packets = " droppedPackets;  
    print "Average End-to-End Delay = " n_to_n_delay * 1000 " ms";  
    print "\\n";  
}`
    },
    {
      type: 'markdown',
      content: '## Distance Vector Routing - TCL'
    },
    {
      type: 'code',
      content: `set ns [new Simulator]

set tracefile [open "dv_routing.tr" w]  
$ns trace-all $tracefile

set n0 [$ns node]  
set n1 [$ns node]  
set n2 [$ns node]  
set n3 [$ns node]  
set n4 [$ns node]

$ns duplex-link $n0 $n1 10Mb 10ms DropTail  
$ns duplex-link $n1 $n2 10Mb 10ms DropTail  
$ns duplex-link $n1 $n3 10Mb 15ms DropTail  
$ns duplex-link $n2 $n4 10Mb 20ms DropTail  
$ns duplex-link $n3 $n4 10Mb 25ms DropTail

set ragent [new Agent/AODV]

$ns attach-agent $n0 $ragent  
$ns attach-agent $n1 $ragent  
$ns attach-agent $n2 $ragent  
$ns attach-agent $n3 $ragent  
$ns attach-agent $n4 $ragent

set tcp0 [new Agent/TCP]  
set sink [new Agent/TCPSink]  
$ns attach-agent $n0 $tcp0  
$ns attach-agent $n4 $sink  
$ns connect $tcp0 $sink

set cbr [new Application/Traffic/CBR]  
$cbr set packetSize_ 512  
$cbr set interval_ 0.5  
$cbr attach-agent $tcp0

$ns at 1.0 "$cbr start"

$ns at 20.0 "finish"

proc finish {} {  
    global ns tracefile  
    $ns flush-trace  
    close $tracefile  
    exit 0  
}

$ns run`
    },
    {
      type: 'markdown',
      content: '## Distance Vector Routing - AWK'
    },
    {
      type: 'code',
      content: `BEGIN {  
    route_updates = 0;  
    data_packets = 0;  
}

# Count routing table updates  
$1 == "+" && $5 == "tcp" && $7 == "---A---" {  
    route_updates++;  
}

# Count data packets sent  
$1 == "s" && $4 == "tcp" {  
    data_packets++;  
}

END {  
    printf("Total routing updates: %d\\n", route_updates);  
    printf("Total data packets sent: %d\\n", data_packets);  
}`
    },
    {
      type: 'markdown',
      content: '## DHCP Simulation - TCL'
    },
    {
      type: 'code',
      content: `set ns [new Simulator]

set tracefile [open "dhcp_output.tr" w]  
$ns trace-all $tracefile

set client1 [$ns node]  
set client2 [$ns node]  
set dhcpServer [$ns node]

$ns duplex-link $client1 $dhcpServer 10Mb 20ms DropTail  
$ns duplex-link $client2 $dhcpServer 10Mb 20ms DropTail

set udpClient1 [new Agent/UDP]  
set udpClient2 [new Agent/UDP]  
set udpServer [new Agent/UDP]

$ns attach-agent $client1 $udpClient1  
$ns attach-agent $client2 $udpClient2  
$ns attach-agent $dhcpServer $udpServer

$ns connect $udpClient1 $udpServer  
$ns connect $udpClient2 $udpServer

set dhcpDiscover1 [new Application/Traffic/Exponential]  
$dhcpDiscover1 set packetSize_ 100   
$dhcpDiscover1 set burst_time_ 0.5   
$dhcpDiscover1 set idle_time_ 0.1    
$dhcpDiscover1 attach-agent $udpClient1

set dhcpDiscover2 [new Application/Traffic/Exponential]  
$dhcpDiscover2 set packetSize_ 100   
$dhcpDiscover2 set burst_time_ 0.5  
$dhcpDiscover2 set idle_time_ 0.1  
$dhcpDiscover2 attach-agent $udpClient2

$ns at 1.0 "$dhcpDiscover1 start"  
$ns at 2.0 "$dhcpDiscover2 start"

set dhcpOffer [new Application/Traffic/Exponential]  
$dhcpOffer set packetSize_ 200   
$dhcpOffer attach-agent $udpServer

$ns at 1.5 "$dhcpOffer start"  
$ns at 2.5 "$dhcpOffer start"

proc finish {} {  
    global ns tracefile  
    $ns flush-trace  
    close $tracefile  
    exit 0  
}

$ns at 5.0 "finish"

$ns run`
    },
    {
      type: 'markdown',
      content: '## DHCP Simulation - AWK'
    },
    {
      type: 'code',
      content: `BEGIN {  
    dhcp_discover_count = 0;  
    dhcp_offer_count = 0;  
    total_delay = 0;  
}

# Count DHCP Discover packets (from clients)  
$1 == "+" && $5 == "exp" && $3 == "2" {  
    dhcp_discover_count++;  
    discover_time[$3] = $2;  
}

# Count DHCP Offer packets (from server)  
$1 == "r" && $5 == "exp" && $3 == "0" {  
    dhcp_offer_count++;  
    if ($3 in discover_time) {  
        total_delay += $2 - discover_time[$3];  
    }  
}

END {  
    # Print statistics  
    printf("Total DHCP Discover messages: %d\\n", dhcp_discover_count);  
    printf("Total DHCP Offer messages: %d\\n", dhcp_offer_count);  
    if (dhcp_offer_count > 0) {  
        printf("Average DHCP response delay: %.5f seconds\\n", total_delay / dhcp_offer_count);  
    }  
}`
    },
    {
      type: 'markdown',
      content: '## Link State Routing - TCL'
    },
    {
      type: 'code',
      content: `set ns [new Simulator]

set tracefile [open "lsr_routing.tr" w]  
$ns trace-all $tracefile

set n0 [$ns node]  
set n1 [$ns node]  
set n2 [$ns node]  
set n3 [$ns node]  
set n4 [$ns node]

$ns duplex-link $n0 $n1 10Mb 10ms DropTail  
$ns duplex-link $n1 $n2 10Mb 10ms DropTail  
$ns duplex-link $n1 $n3 10Mb 15ms DropTail  
$ns duplex-link $n2 $n4 10Mb 20ms DropTail  
$ns duplex-link $n3 $n4 10Mb 25ms DropTail

$ns node-config -adhocRouting OLSR

set tcp0 [new Agent/TCP]  
set sink [new Agent/TCPSink]  
$ns attach-agent $n0 $tcp0  
$ns attach-agent $n4 $sink  
$ns connect $tcp0 $sink

set cbr [new Application/Traffic/CBR]  
$cbr set packetSize_ 512  
$cbr set interval_ 0.5  
$cbr attach-agent $tcp0

$ns at 1.0 "$cbr start"

$ns at 20.0 "finish"

proc finish {} {  
    global ns tracefile  
    $ns flush-trace  
    close $tracefile  
    exit 0  
}

$ns run`
    },
    {
      type: 'markdown',
      content: '## Link State Routing - AWK'
    },
    {
      type: 'code',
      content: `BEGIN {  
    link_state_updates = 0;  
    data_packets_sent = 0;  
    data_packets_received = 0;  
}

# Count OLSR link state updates  
$1 == "s" && $4 == "OLSR" && $7 == "LQ-HELLO" {  
    link_state_updates++;  
}

# Count data packets sent  
$1 == "s" && $4 == "tcp" {  
    data_packets_sent++;  
}

# Count data packets received  
$1 == "r" && $4 == "tcp" {  
    data_packets_received++;  
}

END {  
    printf("Total link state updates: %d\\n", link_state_updates);  
    printf("Total data packets sent: %d\\n", data_packets_sent);  
    printf("Total data packets received: %d\\n", data_packets_received);  
}`
    },
    {
      type: 'markdown',
      content: '## Sliding Window Protocol - TCL'
    },
    {
      type: 'code',
      content: `set ns [new Simulator]

set tracefile [open "sliding_window_output.tr" w]  
$ns trace-all $tracefile

set n0 [$ns node]  
set n1 [$ns node]

$ns duplex-link $n0 $n1 10Mb 20ms DropTail

set tcp [new Agent/TCP]  
$tcp set window_ 5   
$ns attach-agent $n0 $tcp

set sink [new Agent/TCPSink]  
$ns attach-agent $n1 $sink

$ns connect $tcp $sink

set cbr [new Application/Traffic/CBR]  
$cbr set packetSize_ 500   
$cbr set rate_ 1Mb         
$cbr attach-agent $tcp

$ns at 0.5 "$cbr start"  
$ns at 4.5 "$cbr stop"

proc finish {} {  
    global ns tracefile  
    $ns flush-trace  
    close $tracefile  
    exit 0  
}

$ns at 5.0 "finish"

$ns run`
    },
    {
      type: 'markdown',
      content: '## Sliding Window Protocol - AWK'
    },
    {
      type: 'code',
      content: `BEGIN {  
    sent_packets = 0;  
    received_packets = 0;  
    dropped_packets = 0;  
    total_delay = 0;  
    start_time = -1;  
    end_time = 0;  
}

# Count sent packets: when a packet is enqueued for transmission  
$1 == "+" && $5 == "tcp" {  
    sent_packets++;  
}

# Count received packets: when a packet reaches its destination  
$1 == "r" && $5 == "tcp" {  
    received_packets++;  
    if (start_time == -1) {  
        start_time = $2;  
    }  
    end_time = $2;  
}

# Count dropped packets: when a packet is dropped  
$1 == "d" && $5 == "tcp" {  
    dropped_packets++;  
}

# Calculate delay by tracking packet send and receive times using sequence numbers  
$1 == "r" && $5 == "tcp" {  
    seq_num = $11;  
    if (seq_num in send_time) {  
        delay = $2 - send_time[seq_num];  
        total_delay += delay;  
    }  
}

$1 == "+" && $5 == "tcp" {  
    seq_num = $11;  
    send_time[seq_num] = $2;  
}

END {  
    # Calculate throughput in bits per second (bps)  
    simulation_time = end_time - start_time;  
    throughput = (received_packets * 500 * 8) / simulation_time;

    # Calculate packet loss ratio  
    packet_loss_ratio = dropped_packets / sent_packets;

    # Calculate average packet delay  
    if (received_packets > 0) {  
        avg_delay = total_delay / received_packets;  
    } else {  
        avg_delay = 0;  
    }

    # Print the results  
    printf("Sent Packets: %d\\n", sent_packets);  
    printf("Received Packets: %d\\n", received_packets);  
    printf("Dropped Packets: %d\\n", dropped_packets);  
    printf("Packet Loss Ratio: %.2f%%\\n", packet_loss_ratio * 100);  
    printf("Throughput: %.2f bits/sec\\n", throughput);  
    printf("Average Packet Delay: %.5f seconds\\n", avg_delay);  
}`
    },
    {
      type: 'markdown',
      content: '## Leaky Bucket Algorithm - TCL'
    },
    {
      type: 'code',
      content: `set ns [new Simulator]

set tf [open leaky.tr w]  
set nf [open leaky.nam w]  
$ns trace-all $tf  
$ns namtrace-all $nf

set n0 [$ns node]  
set n1 [$ns node]

$ns duplex-link $n0 $n1 1Mb 10ms DropTail  
$ns queue-limit $n0 $n1 10

set udp [new Agent/UDP]  
$ns attach-agent $n0 $udp

set cbr [new Application/Traffic/CBR]  
$cbr set packetSize_ 500  
$cbr set interval_ 0.004  
$cbr attach-agent $udp

set null [new Agent/Null]  
$ns attach-agent $n1 $null  
$ns connect $udp $null

$ns at 0.1 "$cbr start"  
$ns at 4.9 "$cbr stop"  
$ns at 5.0 "finish"

proc finish {} {  
    global ns tf nf  
    $ns flush-trace  
    close $tf  
    close $nf  
    exec nam leaky.nam &  
    exec awk -f analysis.awk leaky.tr > leaky_analysis.txt &  
    exit 0  
}

$ns run`
    },
    {
      type: 'markdown',
      content: '## Leaky Bucket / Token Bucket Analysis - AWK'
    },
    {
      type: 'code',
      content: `BEGIN {  
    sent = 0;  
    received = 0;  
    dropped = 0;  
    start_time = -1;  
    end_time = 0;  
    total_bytes = 0;  
}

{  
    event = $1;  
    time = $2;  
    src = $3;  
    dst = $4;  
    pkt_size = $6;  
    flow_id = $8;

    # Record start time  
    if (start_time == -1 && event == "+") {  
        start_time = time;  
    }

    # Sent packet  
    if (event == "+" && src == "0") {  
        sent++;  
    }

    # Received packet  
    if (event == "r" && dst == "1") {  
        received++;  
        total_bytes += pkt_size;  
        end_time = time;  
    }

    # Dropped packet  
    if (event == "d") {  
        dropped++;  
    }  
}

END {  
    print "Simulation Analysis Report";  
    print "--------------------------";  
    print "Total Packets Sent: ", sent;  
    print "Total Packets Received: ", received;  
    print "Total Packets Dropped: ", dropped;  
    print "Packet Delivery Ratio (%): ", (received / sent) * 100;  
    print "Packet Drop Ratio (%): ", (dropped / sent) * 100;  
    print "Throughput (Kbps): ", (total_bytes * 8) / (end_time - start_time) / 1000;  
}`
    },
    {
      type: 'markdown',
      content: '## Token Bucket Algorithm - TCL'
    },
    {
      type: 'code',
      content: `set ns [new Simulator]

set tf [open token.tr w]  
set nf [open token.nam w]  
$ns trace-all $tf  
$ns namtrace-all $nf

set n0 [$ns node]  
set n1 [$ns node]

$ns duplex-link $n0 $n1 1Mb 10ms DropTail  
$ns queue-limit $n0 $n1 15

set udp [new Agent/UDP]  
$ns attach-agent $n0 $udp

set cbr [new Application/Traffic/CBR]  
$cbr set packetSize_ 500  
$cbr set interval_ 0.001  
$cbr attach-agent $udp

set null [new Agent/Null]  
$ns attach-agent $n1 $null  
$ns connect $udp $null

$ns at 0.1 "$cbr start"  
$ns at 4.9 "$cbr stop"  
$ns at 5.0 "finish"

proc finish {} {  
    global ns tf nf  
    $ns flush-trace  
    close $tf  
    close $nf  
    exec nam token.nam &  
    exec awk -f analysis.awk token.tr > token_analysis.txt &  
    exit 0  
}

$ns run`
    },
    {
      type: 'markdown',
      content: '## DNS Lookup Simulation - TCL'
    },
    {
      type: 'code',
      content: `set ns [new Simulator]

set tracefile [open dns.tr w]  
set namfile [open dns.nam w]  
$ns trace-all $tracefile  
$ns namtrace-all $namfile

set client [$ns node]  
set dns_server [$ns node]

$ns duplex-link $client $dns_server 1Mb 10ms DropTail

set udpClient [new Agent/UDP]  
set udpServer [new Agent/UDP]  
$ns attach-agent $client $udpClient  
$ns attach-agent $dns_server $udpServer

set cbr [new Application/Traffic/CBR]  
$cbr set packetSize_ 50  
$cbr set interval_ 0.2 
$cbr attach-agent $udpClient

set null [new Agent/Null]  
$ns attach-agent $dns_server $null

$ns connect $udpClient $null

$ns at 0.5 "$cbr start"  
$ns at 4.5 "$cbr stop"  
$ns at 5.0 "finish"

proc finish {} {  
    global ns tracefile namfile  
    $ns flush-trace  
    close $tracefile  
    close $namfile  
    exec nam dns.nam &  
    exit 0  
}

$ns run`
    },
    {
      type: 'markdown',
      content: '## DNS Lookup Simulation - AWK'
    },
    {
      type: 'code',
      content: `BEGIN {  
    query_count = 0  
    response_count = 0  
    total_delay = 0  
    completed = 0  
}

{  
    # DNS query packet: look for 'cbr' (client -> server)  
    if ($1 == "+" && $5 == "cbr") {  
        query_count++  
        send_time[$11] = $2  
    }

    # DNS reply received at server (simulate DNS response delay tracking)  
    if ($1 == "r" && $5 == "cbr") {  
        if (send_time[$11] != "") {  
            delay = $2 - send_time[$11]  
            total_delay += delay  
            completed++  
        }  
    }  
}

END {  
    print "DNS Simulation Analysis Report:"  
    print "Total DNS Queries Sent: " query_count  
    print "Total DNS Responses Received: " completed  
    print "Packet Loss: " (query_count - completed)  
    if (completed > 0) {  
        print "Average DNS Response Delay: " total_delay / completed " sec"  
    } else {  
        print "No successful responses to compute delay."  
    }  
}`
    }
  ];

  return (
    <div className={`clipboard-page ${stealthMode ? 'stealth-mode' : ''}`}>
      {showStealthIndicator && (
        <div className="stealth-indicator">
          {stealthMode ? 'Stealth Mode: ON' : 'Stealth Mode: OFF'}
        </div>
      )}
      <div className="clipboard-container">
        <div className="clipboard-header">
          <h1>Code Clipboard</h1>
          <div className="stealth-toggle" onClick={() => {
            setStealthMode(prev => !prev);
            setShowStealthIndicator(true);
            setTimeout(() => setShowStealthIndicator(false), 2000);
          }}>
            {stealthMode ? <FaEyeSlash /> : <FaEye />}
          </div>
        </div>
        <div className="notebook">
          {notebookData.map((cell, index) => (
            <div key={index} className={`cell ${cell.type}-cell`}>
              {cell.type === 'markdown' ? (
                <div className="markdown-content">
                  {cell.content}
                </div>
              ) : (
                <div className="code-cell">
                  <div className="code-header">
                    <div className="code-title" onClick={() => toggleCodeExpansion(index)}>
                      {expandedCodes[index] ? <FaChevronDown /> : <FaChevronRight />}
                      <span>Python</span>
                    </div>
                    <div className="code-actions" style={{ display: 'flex', alignItems: 'center' }}>
                      {!stealthMode && (
                        <button 
                          className="download-button"
                          onClick={() => downloadCode(cell.content, index, notebookData[index-1]?.content || '')}
                          title="Download file"
                          style={{ 
                            marginRight: '8px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            padding: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <FaDownload />
                        </button>
                      )}
                      <button 
                        className={`copy-button ${copiedIndex === index ? 'copied' : ''}`}
                        onClick={() => copyToClipboard(cell.content, index)}
                      >
                        {copiedIndex === index ? (
                          <>
                            <FaCheck /> Copied
                          </>
                        ) : (
                          <>
                            <FaCopy /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  {expandedCodes[index] && (
                    <pre className="code-content">
                      <code>{cell.content}</code>
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClipboardPage; 