# Isolate

![isolate](https://user-images.githubusercontent.com/2801344/44303858-96caca00-a300-11e8-8402-1b5834c03eb6.png)
Isolate is a lightweight image browser for local files.

Isolate works off of your local file system: you get started by dragging and dropping a folder onto the application window. After that, you can navigate to subfolders, search for filenames and open images in full res. Not having to go over the internet [keeps things much faster than other tools like Pinterest.](https://twitter.com/seenaburns/status/950054230852694016)

#### Great things about Isolate

- **No BS**: Isolate isn't a social tool, there's no sharing, notifications, discovery. It just does its job and stays out of your way.
- **Quick**: Both in workflow and snappiness, Isolate is meant for the power users
- **Manage your images how you like**: Isolate just reflects your directory structure, you get to organize things how you see fit (even with nested folders)

## Install

See [releases](https://github.com/seenaburns/Isolate/releases) for prebuilt applications, or `npm install && npm start` after cloning

## Screenshots

![screenshot-browsing](https://user-images.githubusercontent.com/2801344/44303857-95999d00-a300-11e8-9b26-c368e9644c4c.png)
![screenshot-modal](https://user-images.githubusercontent.com/2801344/44303856-94687000-a300-11e8-8537-fff128412224.png)

## Usage

Isolate works off of a base folder, when you first start drag and drop a folder to browse it. You can always drag and drop another folder if you ever want to browse another folder.

#### Navigation

![navigation-drawer](https://user-images.githubusercontent.com/2801344/44303469-87df1a00-a2f6-11e8-8909-d75da4b668b8.png)

When hovering over the bottom toolbar, a drawer appears, containing subdirectories you can navigate too.

- `n` opens this drawer
- `esc` closes it
- `Enter` navigates to the first item in the list
- Typing filters the directories

#### Modal

Clicking on any image will open it, fitting to the window.

- `z` zooms in and out, between fitted and the image's original size
- `ESC` closes the window
- `Left` and `Right` arrow keys navigate between images

**Right clicking** on the image shows you

- `CmdOrCtrl + Shift + C` copies the image to your clipboard
- `CmdOrCtrl + Shift + O` opens the image in your native file manager

#### Toolbar

![popup-menu](https://user-images.githubusercontent.com/2801344/44303740-9a108680-a2fd-11e8-9912-75f247a1f8fc.jpg)

Additionally in the toolbar lets you zoom the image grid, search across directories and more options under the popup menu.

- `CmdOrCtrl +` zooms in
- `CmdOrCtrl -` zooms out
- `CmdOrCtrl n` toggles night/day mode
- Shuffle toggles the order of your images. When changing folders, they are sorted by filename, but shuffle will randomly sort them.
- Hovering over `More` shows you more options

##### Moving

![moving](https://user-images.githubusercontent.com/2801344/44303800-063fba00-a2ff-11e8-86fe-e0ed84e5bfb6.jpg)

Selecting `Move` in the popup menu under `More` lets you select images and move them to other folders. A gold tint shows the selected images.

- Select/Unselect images by clicking them
- `e` activates selection
- `m` opens the directory drawer to move images
- `ESC` exits back to normal mode

##### Searching

A search bar in the top right will search for any files with the term in their path. For example `2d` would match anything in my `inspo/2d/` folder.
