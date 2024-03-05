# network

This contains helpers for setting up wired and wireless network access point on the autokit, for the DUT to connect to. 

It doesn't really fit here - consider refactoring.

## Implementations

- `linuxNetwork`: for using networkmanager for implementing this (assumed)
- `dummyNetwork`: for use when no device is connected