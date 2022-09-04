// ==UserScript==
// @name       MUX Guild Member Locations
// @desciprion Loads locations on guild page
// @namespace  https://greasyfork.org/users/783743
// @version    1
//
// @include  https://muxlegend.com/ru/index.php?page=info&act=getguild&name=*
// ==/UserScript=

class Location {
    name = ""
    x = 0
    y = 0

    /**
     * @param {string} name
     * @param {number} x
     * @param {number} y
     */
    constructor(name, x, y) {
        this.name = name
        this.x = x
        this.y = y
    }
}

class Rect {
    top = 0
    left = 0
    bottom = 0
    right = 0

    /**
     * @param {number} top
     * @param {number} left
     * @param {number} bottom
     * @param {number} right
     */
    constructor(top, left, bottom, right) {
        this.top = top
        this.left = left
        this.bottom = bottom
        this.right = right
    }

    /**
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    contains(x, y) {
        return (x >= this.left) && (x <= this.right) && (y >= this.top) && (y <= this.bottom)
    }
}

const mapSafeZoneAreas = Object.freeze({
    "Loren Market": [new Rect(0, 0, 999,999)],
    "Lorencia": [new Rect(89, 96, 166, 172)],
    "Noria": [new Rect(81, 158, 131, 207)],
    "Devias": [new Rect(5, 170, 76, 241)],
    "Kanturu Relic": [new Rect(70, 100, 93, 111)],
    "Crywolf": [new Rect(6, 89, 64, 153)],
    "Kubera Mine": [new Rect(84, 216, 131, 240)],
    "Deep Dungeon": [new Rect(117, 111, 141, 140), new Rect(116, 121, 134, 139)],
    "Scorched Canyon": [new Rect(6, 230, 26, 245)],
    "Red Smoke Icarus": [new Rect(110, 118, 135, 133)],
    "Ashy Aida": [new Rect(21, 108, 42, 144)],
    "Arena": [new Rect(14, 160, 29, 186)],
    "Devil Square": [new Rect(0, 0, 999, 999)],

    /**
     * @param {Location} location
     * @returns {boolean}
     */
    isSafeZone: function(location) {
        const rects = this[location.name]
        if (!rects) {
            return false
        }

        return rects.some(rect => rect.contains(location.x, location.y))
    }
})

/**
 * @param {string} text
 * @returns {Location|null}
 */
function parseLocation(text) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const locationElem = doc.querySelector("table tr:nth-of-type(8) td:nth-of-type(2) div")
    if (!locationElem) {
        return null

    }

    const locationLine = locationElem.innerHTML
    const matches = locationLine.match(/([^(]+) \((\d+)[^\d]+(\d+)\)/i)
    if (!matches) {
        return null
    }

    return new Location(matches[1], parseInt(matches[2]), parseInt(matches[3]))
}

/**
 * @param {HTMLElement} locationElem
 * @param {string} text
 */
function loadLocationFromText(locationElem, text) {
    const location = parseLocation(text)
    if (!location) {
        locationElem.innerHTML = "🔒"
        return
    }

    if (mapSafeZoneAreas.isSafeZone(location)) {
        locationElem.innerHTML = location.name + " 🛡️"
        return
    }

    locationElem.innerHTML = location.name + " " + location.x + ",&nbsp;" + location.y
}

function loadLocations() {
    let onlineCharCount = 0
    const locationElems = document.querySelectorAll("#over_sh2 tr td:nth-of-type(7)")
    for (let i = 1; i < locationElems.length; i++) {
        if (!locationElems[i].querySelector('img[alt="Online"]')) {
            continue
        }

        const charUrlElem = locationElems[i].parentElement.querySelector("a")
        const charUrl = charUrlElem.href

        setTimeout(function() {
            fetch(charUrl)
                .then(response => response.text())
                .then(text => loadLocationFromText(locationElems[i], text));
        }, onlineCharCount++ * 500)
    }
}

/**
 * @returns {HTMLDivElement}
 */
function createLocationTitleElem() {
    const boldElem = document.createElement("b")

    const titleElem = document.createElement("a")
    titleElem.innerHTML = "Location"
    titleElem.title = "Click to load locations..."
    titleElem.href = "#"
    titleElem.onclick = function (e) {
        e.preventDefault()
        boldElem.innerHTML = "Location"
        loadLocations()

        return false
    }

    boldElem.appendChild(titleElem)

    const titleContainerElem = document.createElement("div")
    titleContainerElem.classList.add("title")
    titleContainerElem.appendChild(boldElem)

    return titleContainerElem
}

const onlineTitleElem = document.querySelector("#over_sh2 tr td:nth-of-type(7)")
onlineTitleElem.appendChild(createLocationTitleElem())
onlineTitleElem.classList.add("sblock2")
onlineTitleElem.align = "center"
