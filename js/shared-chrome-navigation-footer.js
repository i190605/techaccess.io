/* ============================================================================
   TECHACCESS PAKISTAN — Shared chrome (navigation + footer)
   ----------------------------------------------------------------------------
   Nav and footer are defined once here and injected into every page, so the
   information architecture stays in exactly one place. Pure DOM construction —
   no fetch — so the site also works when opened straight from the file system.

   To move to server-side includes later, render NAV/FOOTER into each HTML file
   and delete the mount calls at the bottom; nothing else depends on this.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------- Site information */
  var SOLUTIONS = [
    { t: "Consulting & Implementation", d: "Strategic planning and hands-on delivery against your enterprise roadmap.", g: "advisory" },
    { t: "Cloud", d: "Managed cloud with enterprise-class availability and performance.", g: "cloud" },
    { t: "Security", d: "Integrated network, application, data, and cloud security.", g: "security" },
    { t: "Enterprise Resource Planning", d: "Scalable ERP architecture, licensing, and lifecycle support.", g: "apps" },
    { t: "Data Center", d: "Datacenter design and engineering for mission-critical workloads.", g: "infra" },
    { t: "Virtualization", d: "Modernise compute and storage with resilient virtualization layers.", g: "infra" },
    { t: "Network Services", d: "Switching, routing, wireless, firewalls, and managed security.", g: "infra" },
    { t: "Servers & Storage", d: "Enterprise servers, storage systems, and high-availability design.", g: "infra" },
    { t: "Professional Services", d: "Certified experts plan, deploy, and optimise critical programmes.", g: "advisory" },
    { t: "Cyber Security (SOC / SIEM)", d: "SIEM, SOC, vulnerability assessment, and incident response.", g: "security" },
    { t: "Big Data & Analytics", d: "Analytics engineering across Hadoop, Spark, and enterprise BI.", g: "data" },
    { t: "Remotely Managed Services", d: "Day-to-day IT operations run by a certified remote NOC.", g: "managed" },
    { t: "Business Continuity", d: "BCM, disaster recovery, and resilient datacenter integration.", g: "managed" },
    { t: "Middleware", d: "Connect disparate systems and orchestrate enterprise data exchange.", g: "apps" },
    { t: "Bring Your Own Device", d: "Policy-driven mobility with endpoint compliance built in.", g: "security" },
    { t: "Identity & Access Management", d: "Adaptive authentication and identity governance at scale.", g: "security" }
  ];

  var OFFICES = [
    { city: "Islamabad", tag: "HQ", addr: "4th Floor, Tech Tower, E-11/2", tel: "+92 51 873 5024" },
    { city: "Karachi", tag: "", addr: "Suite 801-802, 8th Floor, Business Tower", tel: "+92 21 356 40331" },
    { city: "Lahore", tag: "", addr: "39-Ahmed Block, Garden Town", tel: "+92 42 3231 6504" },
    { city: "Peshawar", tag: "", addr: "TF-224, Deans Trade Centre", tel: "+92 91 527 5177" }
  ];

  var PARTNERS = [
    "Microsoft", "IBM", "Huawei", "VMware", "Symantec",
    "Hitachi Vantara", "Sangfor", "CY4GATE"
  ];

  /* ----------------------------------------------------------- DOM helpers */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function svgNode(markup) {
    var d = document.createElement("div");
    d.innerHTML = markup;
    return d.firstElementChild;
  }

  /* ------------------------------------------------------------- Icon set */
  var ICONS = {
    mark:
      '<svg class="logo__mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">' +
        '<rect class="lm-ring" x="4.5" y="4.5" width="31" height="31" stroke-width="1.4"/>' +
        '<path class="lm-core" d="M20 9.5 30.5 20 20 30.5 9.5 20Z"/>' +
        '<path class="lm-ring" d="M20 0v5M20 35v5M0 20h5M35 20h5" stroke-width="1.4"/>' +
      '</svg>',
    caret: '<svg class="nav__caret" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M1.5 3.5 5 7l3.5-3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrow: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 11 11 3M11 3H4.5M11 3v6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrowR: '<svg class="btn__ico" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><path d="M2 7.5h11M9 3.5l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    moon: '<svg class="ico-moon" width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M15.5 11.2A7 7 0 0 1 6.8 2.5a7 7 0 1 0 8.7 8.7Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    sun: '<svg class="ico-sun" width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="3.6" stroke="currentColor" stroke-width="1.4"/><path d="M9 .8v2M9 15.2v2M.8 9h2M15.2 9h2M3.2 3.2l1.4 1.4M13.4 13.4l1.4 1.4M14.8 3.2l-1.4 1.4M4.6 13.4l-1.4 1.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    linkedin: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3.4 5.5H1.1V15h2.3V5.5ZM2.25 1a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7ZM15 9.6c0-2.6-1.4-3.8-3.3-3.8-1.5 0-2.2.85-2.6 1.44V5.5H6.8V15h2.3V9.8c0-1.1.2-2.2 1.6-2.2 1.35 0 1.37 1.3 1.37 2.27V15H15V9.6Z"/></svg>',
    facebook: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M16 8.05A8 8 0 1 0 6.75 16v-5.6H4.72V8.05h2.03V6.28c0-2.02 1.2-3.13 3.02-3.13.88 0 1.79.16 1.79.16v1.97h-1c-1 0-1.3.62-1.3 1.25v1.52h2.22l-.36 2.35H9.25V16A8 8 0 0 0 16 8.05Z"/></svg>',
    instagram: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="1.2" y="1.2" width="13.6" height="13.6" rx="4" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="3.2" stroke="currentColor" stroke-width="1.4"/><circle cx="12.1" cy="3.9" r="1" fill="currentColor"/></svg>'
  };

  /* ------------------------------------------------------ Navigation model */
  var NAV = [
    {
      label: "Company",
      href: "#philosophy",
      panel: {
        blurbTitle: "Systems integration since 2000",
        blurbText: "Twenty-five years building and running the infrastructure behind Pakistan's telecom, banking, energy, and public-sector institutions.",
        cta: { label: "About Techaccess", href: "#philosophy" },
        links: [
          { t: "Our Company", d: "Vision, history, leadership, and how we deliver.", h: "#philosophy" },
          { t: "Industries", d: "Telecom, financial services, government, education, health.", h: "#industries" },
          { t: "Partnerships", d: "Alliances with Microsoft, IBM, Huawei, VMware and more.", h: "#partners" },
          { t: "Case Studies", d: "Outcomes from enterprise programmes we have delivered.", h: "#work" },
          { t: "Certifications", d: "ISO 9001, ISO 20000, and ISO 27001 accredited delivery.", h: "#certifications" },
          { t: "Careers", d: "Join 200+ certified engineers and architects.", h: "#contact" }
        ]
      }
    },
    {
      label: "Solutions",
      href: "#solutions",
      panel: {
        blurbTitle: "Sixteen practices, one delivery model",
        blurbText: "Architecture, build, and run — from datacenter and network foundations through cloud, security, data, and managed operations.",
        cta: { label: "All solutions", href: "#solutions" },
        links: SOLUTIONS.slice(0, 12).map(function (s, i) {
          return { t: s.t, d: s.d, h: "#solutions" };
        })
      }
    },
    { label: "Case Studies", href: "#work" },
    { label: "Industries", href: "#industries" },
    { label: "Partners", href: "#partners" }
  ];

  /* ------------------------------------------------------------ Build: nav */
  function logo(size) {
    return el("a", { class: "logo", href: "#main", "aria-label": "Techaccess Pakistan — home" }, [
      svgNode(ICONS.mark),
      el("span", { class: "logo__word", html: "TECHACCESS<br><span>PAKISTAN</span>" })
    ]);
  }

  function buildMegaPanel(item, id) {
    var p = item.panel;
    return el("div", { class: "mega-panel", id: id, "data-mega": item.label }, [
      el("div", { class: "mega-panel__inner" }, [
        el("div", { class: "mega-panel__aside" }, [
          el("p", { class: "eyebrow", text: item.label }),
          el("h2", { class: "h4", text: p.blurbTitle, style: "margin:1rem 0 0.75rem" }),
          el("p", { class: "muted", text: p.blurbText, style: "font-size:0.875rem;line-height:1.6" }),
          el("a", { class: "tlink", href: p.cta.href, style: "margin-top:1.25rem" }, [
            document.createTextNode(p.cta.label), svgNode(ICONS.arrow)
          ])
        ]),
        el("div", { class: "mega-list" }, p.links.map(function (l) {
          return el("a", { class: "mega-link", href: l.h }, [
            el("span", { class: "mega-link__t", text: l.t }),
            el("span", { class: "mega-link__d", text: l.d })
          ]);
        }))
      ])
    ]);
  }

  function buildNav(current) {
    var frag = document.createDocumentFragment();

    var menu = el("ul", { class: "nav__menu" });
    var panels = [];

    NAV.forEach(function (item, i) {
      var li = el("li", { class: "nav__item" });
      var isCurrent = current === item.href;

      if (item.panel) {
        var panelId = "mega-" + i;
        var btn = el("button", {
          class: "nav__link" + (isCurrent ? " is-current" : ""),
          type: "button",
          "aria-expanded": "false",
          "aria-controls": panelId,
          "data-mega-trigger": panelId
        }, [document.createTextNode(item.label), svgNode(ICONS.caret)]);
        li.appendChild(btn);
        panels.push(buildMegaPanel(item, panelId));
      } else {
        li.appendChild(el("a", {
          class: "nav__link" + (isCurrent ? " is-current" : ""),
          href: item.href,
          text: item.label
        }));
      }
      menu.appendChild(li);
    });

    var themeBtn = el("button", {
      class: "icon-btn theme-toggle",
      type: "button",
      "data-theme-toggle": "",
      "aria-label": "Switch colour theme"
    }, [svgNode(ICONS.moon), svgNode(ICONS.sun)]);

    var burger = el("button", {
      class: "icon-btn nav__burger",
      type: "button",
      "aria-expanded": "false",
      "aria-controls": "site-drawer",
      "aria-label": "Menu",
      "data-drawer-toggle": ""
    }, [el("span", { class: "burger-lines", html: "<span></span><span></span><span></span>" })]);

    var contact = el("a", { class: "btn nav__cta", href: "#contact", "data-magnetic": "" }, [
      document.createTextNode("Let us talk"), svgNode(ICONS.arrowR)
    ]);
    contact.style.padding = "0.7rem 1.15rem";

    var nav = el("header", { class: "nav", id: "site-nav" }, [
      el("div", { class: "nav__inner" }, [
        logo(),
        menu,
        el("div", { class: "nav__actions" }, [themeBtn, contact, burger])
      ])
    ]);

    frag.appendChild(nav);
    panels.forEach(function (p) { frag.appendChild(p); });
    frag.appendChild(buildDrawer(current));
    return frag;
  }

  function buildDrawer(current) {
    var drawer = el("div", { class: "drawer", id: "site-drawer" });

    NAV.forEach(function (item, i) {
      if (!item.panel) return;
      var bodyId = "dgroup-" + i;
      var head = el("button", {
        class: "drawer__head",
        type: "button",
        "aria-expanded": "false",
        "aria-controls": bodyId,
        "data-acc-toggle": ""
      }, [document.createTextNode(item.label), svgNode(ICONS.plus)]);

      var inner = el("div", {}, item.panel.links.map(function (l) {
        return el("a", { href: l.h, text: l.t });
      }));
      inner.appendChild(el("a", { href: item.href, text: "View all " + item.label.toLowerCase(), style: "color:var(--red)" }));

      drawer.appendChild(el("div", { class: "drawer__group" }, [
        head, el("div", { class: "drawer__body", id: bodyId }, [inner])
      ]));
    });

    NAV.forEach(function (item) {
      if (item.panel) return;
      drawer.appendChild(el("div", { class: "drawer__group" }, [
        el("a", { class: "drawer__head", href: item.href, text: item.label,
          style: "display:flex;color:" + (current === item.href ? "var(--red)" : "inherit") })
      ]));
    });

    drawer.appendChild(el("div", { class: "drawer__cta" }, [
      el("a", { class: "btn btn--lg", href: "#contact" }, [
        document.createTextNode("Start a conversation"), svgNode(ICONS.arrowR)
      ]),
      el("a", { class: "btn btn--lg btn--ghost", href: "#solutions" }, [
        document.createTextNode("Browse solutions")
      ])
    ]));

    var reach = el("div", { style: "margin-top:2.5rem;display:grid;gap:0.5rem" }, [
      el("p", { class: "eyebrow", text: "Direct" }),
      el("a", { href: "tel:+925111111827", class: "h4", text: "+92 51 111 111 TAP" }),
      el("a", { href: "mailto:sales@techaccesspak.com", class: "muted", text: "sales@techaccesspak.com" })
    ]);
    drawer.appendChild(reach);

    return drawer;
  }

  /* --------------------------------------------------------- Build: footer */
  function buildFooter() {
    var col = function (title, links) {
      return el("div", { class: "footer__col" }, [
        el("h4", { text: title }),
        el("ul", {}, links.map(function (l) {
          return el("li", {}, [el("a", { href: l.h, text: l.t })]);
        }))
      ]);
    };

    var footer = el("footer", { class: "footer invert", id: "site-footer" }, [
      el("div", { class: "wrap wrap--wide" }, [
        svgNode(
          '<svg class="footer__mega" viewBox="0 0 1000 126" data-reveal="clip" role="img" aria-label="Techaccess">' +
            '<text x="0" y="102" textLength="1000" lengthAdjust="spacingAndGlyphs">TECHACCESS</text>' +
          "</svg>"
        ),

        el("div", { class: "footer__cols" }, [
          /* The span and the measure live in the stylesheet, not here: as an
             inline style they outranked the responsive rules, so the blurb
             kept its two-column span at widths where the grid only had two
             columns to give and the link lists ended up ragged. */
          el("div", { class: "footer__col footer__col--lead" }, [
            el("h4", { text: "Innovations to life" }),
            el("p", { class: "muted", style: "font-size:0.95rem;line-height:1.65",
              text: "Since 2000, Techaccess Pakistan has designed, deployed, and operated the enterprise technology that the country's largest institutions depend on — across cloud, infrastructure, security, and data." }),
            el("div", { class: "row", style: "margin-top:1.5rem;gap:0.5rem" }, [
              el("span", { class: "chip chip--dot", text: "ISO 9001" }),
              el("span", { class: "chip chip--dot", text: "ISO 20000" }),
              el("span", { class: "chip chip--dot", text: "ISO 27001" })
            ])
          ]),
          col("Solutions", [
            { t: "Cloud", h: "#solutions" },
            { t: "Cyber Security", h: "#solutions" },
            { t: "Data Center", h: "#solutions" },
            { t: "Network Services", h: "#solutions" },
            { t: "Managed Services", h: "#solutions" },
            { t: "All solutions", h: "#solutions" }
          ]),
          col("Company", [
            { t: "About us", h: "#philosophy" },
            { t: "Industries", h: "#industries" },
            { t: "Partnerships", h: "#partners" },
            { t: "Case studies", h: "#work" },
            { t: "Careers", h: "#contact" },
            { t: "Contact", h: "#contact" }
          ]),
          el("div", { class: "footer__col" }, [
            el("h4", { text: "Offices" }),
            el("ul", {}, OFFICES.map(function (o) {
              return el("li", {}, [
                el("a", { href: "#contact" },
                  [document.createTextNode(o.city + (o.tag ? " (" + o.tag + ")" : ""))])
              ]);
            }))
          ])
        ]),

        el("div", { class: "footer__bottom" }, [
          el("p", { text: "© " + new Date().getFullYear() + " Techaccess Pakistan. All rights reserved." }),
          el("div", { class: "row", style: "gap:1.5rem" }, [
            el("a", { href: "#contact", class: "muted-2", text: "Privacy Policy" }),
            el("a", { href: "tel:+925111111827", class: "muted-2", text: "+92 51 111 111 TAP" })
          ]),
          el("div", { class: "social" }, [
            el("a", { href: "https://www.linkedin.com/company/techaccess-pakistan", "aria-label": "LinkedIn", rel: "noopener", target: "_blank", html: ICONS.linkedin }),
            el("a", { href: "https://www.facebook.com/TechaccessPakistan", "aria-label": "Facebook", rel: "noopener", target: "_blank", html: ICONS.facebook }),
            el("a", { href: "https://www.instagram.com/techaccesspakistan", "aria-label": "Instagram", rel: "noopener", target: "_blank", html: ICONS.instagram })
          ])
        ])
      ])
    ]);

    return footer;
  }

  /* ------------------------------------------------------------ Public API */
  window.TA = window.TA || {};
  window.TA.data = { SOLUTIONS: SOLUTIONS, OFFICES: OFFICES, PARTNERS: PARTNERS };
  window.TA.icons = ICONS;
  window.TA.el = el;
  window.TA.svg = svgNode;

  window.TA.mountChrome = function () {
    var current = (location.pathname.split("/").pop() || "#main");
    var navSlot = document.getElementById("nav-slot");
    var footSlot = document.getElementById("footer-slot");
    if (navSlot) navSlot.replaceWith(buildNav(current));
    if (footSlot) footSlot.replaceWith(buildFooter());
  };

  /* Mount immediately — the script is loaded at the end of <body>, so the
     slots already exist and the chrome paints in the same frame. */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.TA.mountChrome);
  } else {
    window.TA.mountChrome();
  }
})();
