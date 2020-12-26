# omegga-raytracer

![Sample render](https://i.imgur.com/uxZ9M3Z.jpg)

A (cursed) raytracer for Omegga.

Features diffuse lighting, reflections, transparency, and image compression.
An experiment in graphics programming. Not designed to be practical or usable for
actual purposes.

## Installation

Start from the working directory of your Omegga installation (the folder that you run `omegga` in).

`cd plugins`

`git clone git://github.com/voximity/omegga-raytracer.git`

omegga-raytracer has no dependencies and no Omegga config properties. No setup is required.

## Usage

omegga-raytracer has two commands that are both host-only.

| **Command** | **Arguments** | **Example** | **Description** |
| `!trace`  | &lt;yaw&gt; &lt;pitch&gt; | `!trace 45 -30` | Starts a raytrace with the given camera rotation from the position of your torso. |
| `!set`    | &lt;setting&gt; &lt;value&gt; | `!set renderPlayers true` | Sets the value of a setting for the raytracer. Setting values do not persist over plugin reloads/server restarts. |

Below are a list of the settings available with `!set`:

| **Setting** | **Description** | **Default value** | **Example** |
| `res`, `resolution` | The resolution of the scene in pixels. | `64 64` | `!set res 300 200` sets the resolution to 300x200 pixels |
| `fov` | The field of view of the scene camera. | `50` | `!set res 90` sets the FOV to 90 degrees |
| `diffuse`, `diffuseCoefficient` | A number from 0 to 1 representing the diffuse coefficient. | `1` | `!set diffuse 0.5` sets the diffuse coefficient to 0.5 |
| `ambient`, `ambientCoefficient` | A number from 0 to 1 representing the ambient coefficient (multiplier to color when a ray hits a normal opposite the light vector). | `0.2` | `!set ambient 0.5` sets the ambient coefficient to 0.5 |
| `light`, `lightVector` | Three numbers representing the light vector pointing onto scene. | `-0.3 -1 -1` | `!set lightVector -1 -1 -1` sets the light vector to (-1, -1, -1), after normalizing the input vector |
| `shadows` | Whether or not shadows are enabled. When enabled, total ray casts are effectively doubled. | `true` or `on` | `!set shadows false` or `!set shadows off` disables shadows |
| `shadowCoefficient` | A number from 0 to 1 representing the shadow coefficient, similar to `ambientCoefficient`. | `0.4` | `!set shadowCoefficient 0.5` sets the shadow coefficient to 0.5 |
| `maxReflectionDepth`, `reflectionDepth` | Sets the maximum amount of times one ray can bounce off of reflective surfaces. Used to prevent infinite reflections off of closed reflective areas. | `3` | `!set maxReflectionDepth 8` sets the maximum reflection depth to 8 |
| `renderPlayers` | Whether or not players are rendered. Players render as cylinders. | `false` | `!set renderPlayers true` or `!set renderPlayers on` enables the rendering of players |
| `renderGroundPlane` | Whether or not the ground plane is rendered. | `true` | `!set renderGroundPlane true` or `!set renderGroundPlane on` enables rendering of the ground plane |

## How it works

When the command to render the current save is issued, omegga-raytracer saves the game's bricks
and generates a "scene" in which ray hits and bounces will be calculated.

The "scene" is composed of arbitrary `SceneObject`s like the `AxisAlignedBoxObject` (the object
all bricks render by) or the `PlaneObject` (used to render the ground plane). For every pixel
in the image, a ray is shot out from the camera's origin. All objects[^1] in the scene are tested for
an intersection and compared. When these intersections are tested, the renderer also tests for
properties like reflectance, transparency, and shadows, casting rays out in other directions.

When all rays have been cast and bounced an an image is internally developed in memory, the image
is transferred to the [quadtree](https://en.wikipedia.org/wiki/Quadtree) color compressor, which
initially precomputes the depth of the quadtree and generates the tree at its fullest depth, with
each leaf as deep as possible. Then, the optimizer recursively indexes through every branch in
the tree, merging if they are composed of identical leaves. Finally, the quadtree brick builder
constructs the tree out of bricks, generates a save, and loads it in.

[^1]: No acceleration structures are currently used for testing many objects. I would like to
eventually implement a [BVH](https://en.wikipedia.org/wiki/Bounding_volume_hierarchy) to
reduce computation for renders that test large amounts of bricks.

## Contributing

Feel free! If you wish to turn this experiment into something more practical, open a PR!
I will probably not take this experiment to that great an extreme, but you are welcome to
contribute.
