// Sound effect setup
var accessSound = new Audio('../eat.mp3');

function playAccessSound() {
    var p = accessSound.play();
    if (p !== undefined) {
        p.catch(function(e) {});
    }
}

// The fake "hacker" code (Linux Kernel & Network Security snippets)
var rawCode = `/*
 * System Core Protocol Module
 * Establishing secure connection to remote mainframe...
 * Bypass proxy servers [OK]
 * Injecting rootkit payload...
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/crypto.h>
#include <net/sock.h>
#include <net/tcp.h>

#define MAX_PAYLOAD_SIZE 4096
#define RSA_KEY_LENGTH 2048

struct cipher_block {
    u8 data[MAX_PAYLOAD_SIZE];
    u32 key_hash;
    struct list_head list;
};

static int __init sec_init(void) {
    printk(KERN_INFO "SecModule: Initializing deep packet inspection...\\n");
    if (crypto_has_cipher("aes", 0, 0) == 0) {
        panic("SecModule: AES cipher not found! Aborting injection.\\n");
    }
    return 0;
}

void bypass_firewall(struct sock *sk) {
    struct tcp_sock *tp = tcp_sk(sk);
    u32 seq = tp->rcv_nxt;
    
    // Injecting buffer overflow payload
    char payload[] = "\\x90\\x90\\x90\\x90\\x31\\xc0\\x50\\x68\\x2f\\x2f\\x73\\x68";
    
    if (sk->sk_state == TCP_ESTABLISHED) {
        printk(KERN_DEBUG "Target locked. Injecting rootkit at seq: %u\\n", seq);
        tp->rcv_nxt += sizeof(payload);
        tcp_send_ack(sk);
    }
}

int decrypt_rsa_stream(u8 *buffer, size_t len, struct crypto_tfm *tfm) {
    int ret;
    struct scatterlist sg;
    
    sg_init_one(&sg, buffer, len);
    ret = crypto_cipher_decrypt_one(tfm, buffer, buffer);
    
    if (ret) {
        printk(KERN_ERR "Decryption failed! Retrying with brute-force table.\\n");
        return -EFAULT;
    }
    
    return 0; 
}

// Memory dump initiated...
// Extracting admin credentials...
`;

// Duplicate the code so it never runs out
var fullCode = rawCode.repeat(100);

var currentPos = 0;
var consoleSpan = document.getElementById("console");
var accessDiv = document.getElementById("access-granted");
var isAccessGranted = false;

// Core typing function
function typeCode(charsToType) {
    if (isAccessGranted) return; // Stop typing if access is granted
    
    if (currentPos >= fullCode.length) {
        currentPos = 0;
    }
    
    var textToAdd = fullCode.substring(currentPos, currentPos + charsToType);
    consoleSpan.appendChild(document.createTextNode(textToAdd));
    currentPos += charsToType;
    
    // Auto-scroll to the bottom of the page
    window.scrollTo(0, document.body.scrollHeight);
}

// Trigger Access Granted Screen
function showAccessGranted() {
    if (isAccessGranted) return;
    isAccessGranted = true;
    accessDiv.style.display = "block";
    playAccessSound();
    
    // Hide after 3 seconds and resume
    setTimeout(function() {
        accessDiv.style.display = "none";
        isAccessGranted = false;
    }, 3000);
}

// --- PC KEYBOARD CONTROLS ---
window.addEventListener("keydown", function(e) {
    if (e.key === "Enter" || e.key === "Alt") {
        showAccessGranted();
    } else if (e.key !== "Shift" && e.key !== "Control" && e.key !== "Meta" && e.key !== "Backspace") {
        // Type 3 to 7 characters per keystroke for a fast typing effect
        typeCode(4 + Math.floor(Math.random() * 4));
    }
});

// --- MOBILE TOUCH CONTROLS ---
var holdInterval;
var lastTap = 0;

function startMobileTyping() {
    clearInterval(holdInterval);
    // Rapidly print code while finger is held on screen
    holdInterval = setInterval(function() {
        typeCode(5 + Math.floor(Math.random() * 3));
    }, 40);
}

function stopMobileTyping() {
    clearInterval(holdInterval);
}

window.addEventListener("touchstart", function(e) {
    if (e.target.tagName === "A") return; // Don't trigger on the Exit button
    e.preventDefault();
    
    // Double tap detection for Access Granted on mobile
    var currentTime = new Date().getTime();
    var tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
        showAccessGranted();
    } else {
        startMobileTyping();
    }
    lastTap = currentTime;
}, { passive: false });

window.addEventListener("touchend", stopMobileTyping);
window.addEventListener("touchcancel", stopMobileTyping);

// Fallback for mouse dragging on PC
window.addEventListener("mousedown", function(e) {
    if (e.target.tagName === "A") return;
    startMobileTyping();
});
window.addEventListener("mouseup", stopMobileTyping);
