document.addEventListener('DOMContentLoaded', function() {
    function b(B) {
        let C;
        switch (B.type) {
            case 'checkbox':
                C = B.checked ? 1 : 0;
                break;
            case 'range':
            case 'select-one':
                C = B.value;
                break;
            case 'button':
            case 'submit':
                C = '1';
                break;
            default:
                return;
        }
        const D = `${c}/control?var=${B.id}&val=${C}`;
        fetch(D).then(E => {
            console.log(`request to ${D} finished, status: ${E.status}`)
        })
    }
    var c = document.location.origin;
    const e = B => {
            B.classList.add('hidden')
        },
        f = B => {
            B.classList.remove('hidden')
        },
        g = B => {
            B.classList.add('disabled'), B.disabled = !0
        },
        h = B => {
            B.classList.remove('disabled'), B.disabled = !1
        },
        i = (B, C, D) => {
            D = !(null != D) || D;
            let E;
            'checkbox' === B.type ? (E = B.checked, C = !!C, B.checked = C) : (E = B.value, B.value = C), D && E !== C ? b(B) : !D && ('aec' === B.id ? C ? e(v) : f(v) : 'agc' === B.id ? C ? (f(t), e(s)) : (e(t), f(s)) : 'awb_gain' === B.id ? C ? f(x) : e(x) : 'face_recognize' === B.id && (C ? h(n) : g(n)))
        };
    document.querySelectorAll('.close').forEach(B => {
        B.onclick = () => {
            e(B.parentNode)
        }
    }), fetch(`${c}/status`).then(function(B) {
        return B.json()
    }).then(function(B) {
        document.querySelectorAll('.default-action').forEach(C => {
            i(C, B[C.id], !1)
        })
    });
    const j = document.getElementById('stream'),
        k = document.getElementById('stream-container'),
        l = document.getElementById('get-still'),
        m = document.getElementById('toggle-stream'),
        n = document.getElementById('face_enroll'),
        o = document.getElementById('close-stream'),
        p = () => {
            window.stop(), m.innerHTML = 'Start Stream'
        },
        q = () => {
            j.src = `${c+':81'}/stream`, f(k), m.innerHTML = 'Stop Stream'
        };
    l.onclick = () => {
        p(), j.src = `${c}/capture?_cb=${Date.now()}`, f(k)
    }, o.onclick = () => {
        p(), e(k)
    }, m.onclick = () => {
        const B = 'Stop Stream' === m.innerHTML;
        B ? p() : q()
    }, n.onclick = () => {
        b(n)
    }, document.querySelectorAll('.default-action').forEach(B => {
        B.onchange = () => b(B)
    });
    const r = document.getElementById('agc'),
        s = document.getElementById('agc_gain-group'),
        t = document.getElementById('gainceiling-group');
    r.onchange = () => {
        b(r), r.checked ? (f(t), e(s)) : (e(t), f(s))
    };
    const u = document.getElementById('aec'),
        v = document.getElementById('aec_value-group');
    u.onchange = () => {
        b(u), u.checked ? e(v) : f(v)
    };
    const w = document.getElementById('awb_gain'),
        x = document.getElementById('wb_mode-group');
    w.onchange = () => {
        b(w), w.checked ? f(x) : e(x)
    };
    const y = document.getElementById('face_detect'),
        z = document.getElementById('face_recognize'),
        A = document.getElementById('framesize');
    A.onchange = () => {
        b(A), 5 < A.value && (i(y, !1), i(z, !1))
    }, y.onchange = () => {
        return 5 < A.value ? (alert('Please select CIF or lower resolution before enabling this feature!'), void i(y, !1)) : void(b(y), !y.checked && (g(n), i(z, !1)))
    }, z.onchange = () => {
        return 5 < A.value ? (alert('Please select CIF or lower resolution before enabling this feature!'), void i(z, !1)) : void(b(z), z.checked ? (h(n), i(y, !0)) : g(n))
    }
});