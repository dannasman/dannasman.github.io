---
layout: post
title: "Writing a simple USB device driver that detects an USB device in Linux"
date: 2024-01-21
categories: complex-numbers rust simd
---

# Introduction

I have spent the past week building my own Linux distribution for Rasbperry Pi 4 following the [PiLFS guide](https://intestinate.com/pilfs/guide.html). After managing to successfully boot the distribution I decided to try writing an USB device driver that detects when my [Wacom drawing tablet](https://www.wacom.com/en-us/products/pen-tablets/one-by-wacom) is plugged.

# Driver code

The code for the module was taken from [here](https://sysplay.github.io/books/LinuxDrivers/book/Content/Part11.html). In `wacom_register.c`:
```c
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/usb.h>

static int wacom_probe(struct usb_interface *interface, const struct usb_device_id *id)
{
    printk(KERN_INFO "Wacom drive (%04X:%04X) plugged\n", id->idVendor, id->idProduct);

    return 0;
}

static void wacom_disconnect(struct usb_interface *interface)
{
    printk(KERN_INFO "Wacom drive removed\n");
}
static struct usb_device_id wacom_table[] =
{
    { USB_DEVICE(0x056A, 0x037B) },
    {}
};
MODULE_DEVICE_TABLE (usb, wacom_table);

static struct usb_driver wacom_driver =
{
    .name = "wacom_driver",
    .id_table = wacom_table,
    .probe = wacom_probe,
    .disconnect = wacom_disconnect,
};

static int __init wacom_init(void)
{
    return usb_register(&wacom_driver);
}

static void __exit wacom_exit(void)
{
    usb_deregister(&wacom_driver);
}

module_init(wacom_init);
module_exit(wacom_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Dan Näsman");
```

If you are using the code above as a base for your own kernel module, make sure that the values in `USB_DEVICE(<vendor_id>, <product_id>)` match the values of your device of choice.

# Loading the driver

To load the driver after compiling the code run
```
sudo insmod wacom_register.ko
```
To see if the driver was loaded successfully run
```
sudo dmesg
```
To unload the driver run
```
sudo rmmod wacom_register
```

When I first loaded the driver I noticed that the probe function `wacom_probe` was never called. After some digging I found out that this was due to some other driver(s) already probing the device. In order for our driver to successfully probe the device we need to unload the other drivers which were `usb_storage`, `hid` and `wacom` in my case. So I ran the command
```
sudo rmmod <driver>
```
for each of these drivers receiving an error
```
rmmod: ERROR: Module <driver> is builtin.
```
for `usb_storage` and `hid`. Turns out that the kernel I compiled when following the PiLFS guide included the modules I was trying to unload. A new compilation of the kernel with some tweaks to the configurations would have needed to be done in order to use `rmmod` to unload these models.

But I was not keen on building a new kernel after I had just managed to get my new distro working. Turns out there is another way. You can blacklist the initialization functions of these drivers in `/boot/cmdline.txt` by writing
```
initcall_blacklist=usb_storage_driver_init,hid_init,wacom_driver_init
```
But what if you do not know the name of the init function of the driver? If this is the case you can also write
```
initcall_debug
```
to `/boot/cmdline.txt`. This makes the kernel trace initcalls as they are executed.\\
By running `sudo dmesg | grep initcall` you will get a list of all the initcalls that have been executed and from this list you can search the initcall of the driver of your choice.

After editing `/boot/cmdline.txt` and rebooting the system we now get
```bash
-bash-5.2$ sudo insmod wacom_register.ko 
-bash-5.2$ sudo dmesg
[   51.499351] Wacom drive (056A:037B) plugged
[   51.499481] probe of 1-1.2:1.0 returned 0 after 169 usecs
-bash-5.2$ 
```

Finally! A very simple driver that detects whether a device is plugged has been written. For any comments/corrections please feel free to email me!
