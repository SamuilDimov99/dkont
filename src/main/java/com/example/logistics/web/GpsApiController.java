package com.example.logistics.web;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;

@RestController
@RequestMapping("/api/gps")
@RequiredArgsConstructor
public class GpsApiController {

    private final GpsStore gpsStore;

    @GetMapping
    public Collection<GpsStore.GpsPosition> getAll() {
        return gpsStore.getAll();
    }

    @PostMapping("/{id}")
    public void update(@PathVariable Long id, @RequestBody GpsStore.GpsPosition position) {
        gpsStore.update(id, position.lat(), position.lng());
    }
}
