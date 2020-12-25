class Matrix {
    constructor(x, y, z, m00, m01, m02, m10, m11, m12, m20, m21, m22) {
        this.x = x; this.y = y; this.z = z;
        this.m00 = m00; this.m01 = m01; this.m02 = m02;
        this.m10 = m10; this.m11 = m11; this.m12 = m12;
        this.m20 = m20; this.m21 = m21; this.m22 = m22;
    }

    static fromAnglesZYX(rx, ry, rz) {
        return new Matrix(0, 0, 0, Math.cos(rz), -Math.sin(rz), 0, Math.sin(rz), Math.cos(rz), 0, 0, 0, 1).multiply(
            new Matrix(0, 0, 0, Math.cos(ry), 0, Math.sin(ry), 0, 1, 0, -Math.sin(ry), 0, Math.cos(ry))).multiply(
            new Matrix(0, 0, 0, 1, 0, 0, 0, Math.cos(rx), -Math.sin(rx), 0, Math.sin(rx), Math.cos(rx)));
    }

    static fromAnglesXYZ(rx, ry, rz) {
        return new Matrix(0, 0, 0, 1, 0, 0, 0, Math.cos(rx), -Math.sin(rx), 0, Math.sin(rx), Math.cos(rx)).multiply(
            new Matrix(0, 0, 0, Math.cos(ry), 0, Math.sin(ry), 0, 1, 0, -Math.sin(ry), 0, Math.cos(ry))).multiply(
            new Matrix(0, 0, 0, Math.cos(rz), -Math.sin(rz), 0, Math.sin(rz), Math.cos(rz), 0, 0, 0, 1));
    }

    static fromForwardVector(vec) {
        const forward = vec.normalize();
        const right = new Vector3(0, 1, 0).cross(vec);
        const up = forward.cross(right);
        return new Matrix(0, 0, 0, right.x, right.y, right.z, up.x, up.y, up.z, -forward.x, -forward.y, -forward.z);
    }

    components() {
        return [this.m00, this.m01, this.m02, this.x, this.m10, this.m11, this.m12, this.y, this.m20, this.m21, this.m22, this.z, 0, 0, 0, 1];
    }

    rowedComponents() {
        return [[this.m00, this.m01, this.m02, this.x], [this.m10, this.m11, this.m12, this.y], [this.m20, this.m21, this.m22, this.z], [0, 0, 0, 1]];
    }

    multiply(other) {
        const a = this.rowedComponents();
        const b = other.rowedComponents();
        const o = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                for (var k = 0; k < 4; k++) {
                    o[i][j] += a[i][k] * b[k][j];
                }
            }
        }
        return new Matrix(o[0][3], o[1][3], o[2][3], o[0][0], o[0][1], o[0][2], o[1][0], o[1][1], o[1][2], o[2][0], o[2][1], o[2][2]);
    }

    forwardVector() {
        return new Vector3(-this.m20, -this.m21, -this.m22);
    }
}

class Vector3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    magnitude() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }

    normalize() {
        const mag = this.magnitude();
        return new Vector3(this.x / mag, this.y / mag, this.z / mag);
    }

    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    cross(other) {
        return new Vector3(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x
        );
    }

    add(other) {
        return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    subtract(other) {
        return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
    }

    scale(n) {
        return new Vector3(this.x * n, this.y * n, this.z * n);
    }

    angleBetween(other) {
        return Math.acos(this.dot(other) / (this.magnitude() * other.magnitude()));
    }

    inverse() {
        const ret = new Vector3(1.0 / this.x, 1.0 / this.y, 1.0 / this.z);
        return new Vector3(isNaN(ret.x) ? 0 : ret.x, isNaN(ret.y) ? 0 : ret.y, isNaN(ret.z) ? 0 : ret.z);
    }

    negate() {
        return new Vector3(-this.x, -this.y, -this.z);
    }

    multiply(other) {
        return new Vector3(this.x * other.x, this.y * other.y, this.z * other.z);
    }

    abs() {
        return new Vector3(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z));
    }
}

class Ray {
    constructor(origin, direction) {
        this.origin = origin;
        this.direction = direction.normalize();
        this.m = this.direction.inverse();
    }

    closestPoint(v3) {
        const ap = v3.subtract(this.origin);
        const ab = this.direction;
        return this.origin.add(this.direction.scale(ap.dot(ab) / ab.dot(ab)));
    }

    // legacy box intersection
    intersectsPrism(origin, size) {
        const p = this.closestPoint(origin);
        const d = p.subtract(origin);
        return (d.x >= -size.x && d.x <= size.x &&
            d.y >= -size.y && d.y <= size.y &&
            d.z >= -size.z && d.z <= size.z) ?
            p :
            null;
    }

    // legacy box intersection (replaced in favor of SceneObjects)
    boxIntersection(origin, size) {
        const ro = this.origin.subtract(origin);
        const s = new Vector3(
            this.direction.x < 0 ? 1 : -1,
            this.direction.y < 0 ? 1 : -1,
            this.direction.z < 0 ? 1 : -1
        );
        const t1 = this.m.multiply(ro.negate().add(s.multiply(size)));
        const t2 = this.m.multiply(ro.negate().subtract(s.multiply(size)));
        const tn = Math.max(Math.max(t1.x, t1.y), t1.z);
        const tf = Math.min(Math.min(t2.x, t2.y), t2.z);
        if (tn > tf || tf < 0) return null;
        var normal;
        if (t1.x > t1.y && t1.x > t1.z) normal = new Vector3(s.x, 0, 0)
        else if (t1.y > t1.z) normal = new Vector3(0, s.y, 0)
        else normal = new Vector3(0, 0, s.z);
        return [tn, tf, normal];
    }

    // Get a point down the ray, t units.
    pointAlong(t) {
        return this.origin.add(this.direction.normalize().scale(t));
    }
}

class Scene {
    constructor(camera, dc, ac, lv, castShadows, sc) {
        this.camera = camera;
        this.objects = [];
        this.diffuseCoefficient = dc || 1;
        this.ambientCoefficient = ac || 0.2;
        this.atmosphere = new Atmosphere([206, 225, 245], [144, 195, 245]);
        this.lightVector = (lv || new Vector3(-1, -1, -1)).normalize().negate();
        this.castShadows = castShadows == null ? true : castShadows;
        this.shadowCoefficient = sc || 0.4;
        this.maxReflectionDepth = 1;
    }

    async populateScene(save, omegga) {
        this.objects = [];
        save.bricks.forEach((brick) => {
            const pos = new Vector3(...brick.position);
            const dir = brick.direction;
            const rot = brick.rotation % 2;
            var [sx, sy, sz] = brick.size;
            var nsx = 0, nsy = 0, nsz = 0;

            // todo: test these, currently only dirs 4 and 5 work
            if (dir == 0 || dir == 1) { // x
                nsx = sz;
                nsy = rot == 0 ? sx : sy;
                nsz = rot == 0 ? sy : sx;
            } else if (dir == 2 || dir == 3) { // y
                nsx = rot == 0 ? sx : sy;
                nsy = sz;
                nsz = rot == 0 ? sy : sx;
            } else if (dir == 4 || dir == 5) { // z, default
                nsx = rot == 0 ? sx : sy;
                nsy = rot == 0 ? sy : sx;
                nsz = sz;
            }

            const color = typeof(brick.color) == "number" ? save.colors[brick.color] : brick.color;
            const reflectiveness = save.materials[brick.material_index] == "BMC_Metallic" ? 0.6 : 0;
            this.objects.push(new AxisAlignedBoxObject(pos, new Vector3(nsx, nsy, nsz), color.slice(0, 3), reflectiveness));
        });

        // players, todo: make this a config option
        const posns = await omegga.getAllPlayerPositions();
        posns.forEach(async (obj) => {
            const pos = new Vector3(...obj.pos);
            if (pos.subtract(this.camera.origin).magnitude() < 5) return;
            const pa = pos.subtract(new Vector3(0, 0, 20));
            const pb = pos.add(new Vector3(0, 0, 20));
            this.objects.push(new CylinderObject(pa, pb, 10, [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)]));
            //this.objects.push(new AxisAlignedBoxObject(new Vector3(...obj.pos), new Vector3(10, 10, 30), [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)]));
        });

        // the ground plane
        this.objects.push(new PlaneObject(new Vector3(0, 0, 0), new Vector3(0, 0, 1), [58, 166, 60]));
    }

    // Returns the object {object: <object intersected>, near: <tnear>, far: <tfar>, normal: <normal>}
    castRay(ray, objects) {
        const intersectedObjects = [];
        objects.forEach((object) => {
            const results = object.intersectionWithRay(ray);
            if (results != null)
                intersectedObjects.push({object: object, near: results[0], far: results[1], normal: results[2]});
        });

        if (intersectedObjects.length == 0) {
            return null;
        } else if (intersectedObjects.length == 1) {
            return intersectedObjects[0];
        } else {
            return intersectedObjects.sort((a, b) => a.near - b.near)[0]
        }
    }

    getRayColor(ray, reflectionDepth) {
        const hit = this.castRay(ray, this.objects);

        if (hit == null) {
            return this.atmosphere.colorFromVec(ray.direction);
        } else {
            const coeff = lerp(this.diffuseCoefficient, this.ambientCoefficient, Math.min(this.lightVector.angleBetween(hit.normal) / Math.PI * 0.5, 1));
            var color = hit.object.sRGB().slice(0, 3).map((c) => c * coeff);

            // shadow calculation
            if (this.castShadows) {
                const shadowRay = new Ray(ray.pointAlong(hit.near).add(hit.normal.scale(0.01)), this.lightVector);
                const shadowHit = this.castRay(shadowRay, this.objects);
                if (shadowHit != null) color = color.map((c) => c * this.shadowCoefficient);
            }

            // reflection calculation
            if (reflectionDepth < this.maxReflectionDepth && hit.object.reflectiveness > 0.1) {
                const reflectionRay = new Ray(ray.pointAlong(hit.near).add(hit.normal.scale(0.01)), ray.direction.subtract(hit.normal.scale(2 * ray.direction.dot(hit.normal))));
                const reflectionHitColor = this.getRayColor(reflectionRay, reflectionDepth + 1);
                color = lerpCol(color, reflectionHitColor, hit.object.reflectiveness);
            }

            return color;
        }
    }

    render() {
        const w = this.camera.vw, h = this.camera.vh;
        var img = [];
        for (var y = 0; y < h; y++) {
            img[y] = [];
            for (var x = 0; x < w; x++) {
                const ray = new Ray(this.camera.origin, this.camera.directionForScreenPoint(x, y));
                img[y][x] = this.getRayColor(ray, 0);
            }
        }
        return img;
    }
}

class Camera {
    constructor(vw, vh, origin, fov, yaw, pitch) {
        this.vw = vw;
        this.vh = vh;
        this.origin = origin;
        this.yaw = yaw;
        this.pitch = pitch;
        this.fov = fov;
        this.chf = Math.tan((90 - fov * 0.5) * 0.017453);
    }

    directionForScreenPoint(x, y) {
        return Matrix.fromForwardVector(this.directionFromFov(x, y)).multiply(Matrix.fromAnglesXYZ(0, this.pitch, -this.yaw)).forwardVector();
    }

    directionFromFov(x, y) {
        const nx = x - this.vw * 0.5;
        const ny = y - this.vh * 0.5;
        const z = this.vh * 0.5 * this.chf;
        return new Vector3(z, nx, ny).normalize();
    }
}

class Atmosphere {
    constructor(horizon, zenith) {
        this.horizon = horizon;
        this.zenith = zenith;
        this.up = new Vector3(0, 0, 1);
    }

    distFromZenith(vec) {
        return Math.min(this.up.angleBetween(vec) / Math.PI * 0.5, 1);
    }

    colorFromVec(vec) {
        const c = this.distFromZenith(vec);
        return [
            lerp(this.zenith[0], this.horizon[0], c),
            lerp(this.zenith[1], this.horizon[1], c),
            lerp(this.zenith[2], this.horizon[2], c)
        ]
    }
}

class SceneObject {
    constructor(color, reflectiveness) {
        this.color = color;
        this.reflectiveness = reflectiveness || 0;
    }

    // Returns [t_near, t_far, hit_normal] if hit, otherwise returns null
    intersectionWithRay(ray) {
        return null;
    }

    sRGBchannel = (c) => c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c;

    sRGB() {
        return this.color.map((c) => this.sRGBchannel(c / 255) * 255);
    }
}

class AxisAlignedBoxObject extends SceneObject {
    constructor(pos, size, color, reflectiveness) {
        super(color, reflectiveness);
        this.pos = pos;
        this.size = size;
    }

    intersectionWithRay(ray) {
        const ro = ray.origin.subtract(this.pos);
        const s = new Vector3(
            ray.direction.x < 0 ? 1 : -1,
            ray.direction.y < 0 ? 1 : -1,
            ray.direction.z < 0 ? 1 : -1
        );
        const t1 = ray.m.multiply(ro.negate().add(s.multiply(this.size)));
        const t2 = ray.m.multiply(ro.negate().subtract(s.multiply(this.size)));
        const tn = Math.max(Math.max(t1.x, t1.y), t1.z);
        const tf = Math.min(Math.min(t2.x, t2.y), t2.z);
        if (tn >= tf || tf < 0) return null;
        var normal;
        if (t1.x > t1.y && t1.x > t1.z) normal = new Vector3(s.x, 0, 0)
        else if (t1.y > t1.z) normal = new Vector3(0, s.y, 0)
        else normal = new Vector3(0, 0, s.z);
        return [tn, tf, normal];
    }
}

class PlaneObject extends SceneObject {
    constructor(pos, normal, color) {
        super(color);
        this.pos = pos;
        this.normal = normal;
    }

    intersectionWithRay(ray) {
        const denom = this.normal.dot(ray.direction);
        if (Math.abs(denom) > 0.0001) {
            const t = this.pos.subtract(ray.origin).dot(this.normal) / denom;
            if (t >= 0) return [t, t, this.normal];
        }
        return null;
    }
}

class CylinderObject extends SceneObject {
    constructor(pa, pb, radius, color, reflectiveness) {
        super(color, reflectiveness);
        this.pa = pa;
        this.pb = pb;
        this.radius = radius;
    }

    intersectionWithRay(ray) {
        const ba = this.pb.subtract(this.pa);
        const oc = ray.origin.subtract(this.pa);
        const baba = ba.dot(ba);
        const bard = ba.dot(ray.direction);
        const baoc = ba.dot(oc);
        const k2 = baba - bard * bard;
        const k1 = baba * oc.dot(ray.direction) - baoc * bard;
        const k0 = baba * oc.dot(oc) - baoc * baoc - this.radius * this.radius * baba;
        var h = k1 * k1 - k2 * k0;
        if (h < 0.0) return null;
        h = Math.sqrt(h);
        var t = (-k1 - h) / k2;
        const y = baoc +  t * bard;
        if (t < 0.0) return null;
        if (y > 0.0 && y < baba) return [t, t, (oc.add(ray.direction.scale(t)).subtract(ba.scale(y).scale(1/baba)).scale(1/this.radius))];
        t = ((y < 0 ? 0 : baba) - baoc) / bard;
        if (Math.abs(k1 + k2 * t) < h) return [t, t, ba.scale(y == 0 ? 0 : (y > 0 ? 1 : -1)).scale(1/baba)];
        return null;
    }
}

const lerp = (a, b, c) => a + (b - a) * c;
const lerpCol = (a, b, c) => [lerp(a[0], b[0], c), lerp(a[1], b[1], c), lerp(a[2], b[2], c)];

class Raytracer {
    constructor(omegga, config, store) {
        this.omegga = omegga;
        this.config = config;
        this.store = store;
    }

    async init() {
        const settings = {
            width: 150,
            height: 100,
            verticalFov: 50,
            diffuseCoefficient: 1,
            ambientCoefficient: 0.2,
            lightVector: new Vector3(-0.3, -1, -1),
            castShadows: true,
            shadowCoefficient: 0.4,
            maxReflectionDepth: 3 // set to 0 to disable reflections
        };

        this.omegga.on("chatcmd:set", async (name, setting, ...values) => {
            const player = this.omegga.getPlayer(name);
            if (!player.isHost()) return;
            if (setting == "res" || setting == "resolution") {
                settings.width = parseInt(values[0]);
                settings.height = parseInt(values[1]);
                this.omegga.broadcast(`Resolution set to ${settings.width}x${settings.height}.`);
            } else if (setting == "fov") {
                settings.verticalFov = parseInt(values[0]);
                this.omegga.broadcast(`FOV set to ${settings.verticalFov}.`);
            } else if (setting == "diffuse" || setting == "diffuseCoefficient") {
                settings.diffuseCoefficient = parseFloat(values[0]);
                this.omegga.broadcast(`Diffuse coefficient set to ${settings.diffuseCoefficient}.`);
            } else if (setting == "ambient" || setting == "ambientCoefficient") {
                settings.ambientCoefficient = parseFloat(values[0]);
                this.omegga.broadcast(`Ambient coefficient set to ${settings.ambientCoefficient}.`);
            } else if (setting == "light" || setting == "lightVector") {
                settings.lightVector = new Vector3(...values.map((v) => parseFloat(v)));
                this.omegga.broadcast(`Light vector set to (${settings.lightVector.x}, ${settings.lightVector.y}, ${settings.lightVector.z}).`);
            } else if (setting == "shadows") {
                settings.castShadows = values[0] == "true" || values[0] == "on";
                this.omegga.broadcast(`Casting shadows set to ${settings.castShadows}.`);
            } else if (setting == "shadowCoefficient") {
                settings.shadowCoefficient = parseFloat(values[0]);
                this.omegga.broadcast(`Shadow coefficient set to ${settings.shadowCoefficient}.`);
            } else if (setting == "reflectionDepth" || setting == "maxReflectionDepth") {
                settings.maxReflectionDepth = parseInt(values[0]);
                this.omegga.broadcast(`Max reflection depth set to ${settings.maxReflectionDepth}.`);
            } else {
                this.omegga.broadcast(`Invalid setting name <code>${setting}</code>.`);
                return;
            }
        });

        this.omegga.on("chatcmd:trace", async (name, yaw, pitch) => {
            const player = this.omegga.getPlayer(name);
            if (!player.isHost()) return;
            const pos = await player.getPosition();

            this.omegga.broadcast("Reading bricks...");
            const save = await this.omegga.getSaveData();

            // start raytracing
            const camera = new Camera(settings.width, settings.height, new Vector3(...pos), settings.verticalFov, (parseFloat(yaw) || 0) * Math.PI / 180, (parseFloat(pitch) || 0) * Math.PI / 180);
            const scene = new Scene(camera, settings.diffuseCoefficient, settings.ambientCoefficient, settings.lightVector, settings.castShadows, settings.shadowCoefficient);
            scene.maxReflectionDepth = settings.maxReflectionDepth;
            this.omegga.broadcast("Scene initialized. Populating scene objects...");
            await scene.populateScene(save, this.omegga);
            this.omegga.broadcast("Scene populated. Rendering...");
            const img = scene.render();

            // image generated, load it into the world
            const newPos = await player.getPosition();
            this.omegga.broadcast("Rendered. Importing save...");
            const brickGen = [];
            for (var y = 0; y < settings.height; y++) {
                for (var x = 0; x < settings.width; x++) {
                    var col = img[y][x];
                    if (col == null) col = [255, 255, 255, 100]; else col = [...col, 255];
                    const [px, py, pz] = newPos.map((n) => Math.floor(n + 0.5));
                    const brick = {
                        "asset_name_index": 0,
                        "size": [1, 1, 1],
                        "position": [px, py + 20 + x * 2, pz + y * 2],
                        "color": col
                    };
                    brickGen.push(brick);
                }
            }

            this.omegga.loadSaveData({"brick_assets": ["PB_DefaultMicroBrick"], "bricks": brickGen}, 0, 0, 0, true);
            this.omegga.broadcast("Raytrace complete.");
        });
    }

    async stop() {

    }
}

module.exports = Raytracer;