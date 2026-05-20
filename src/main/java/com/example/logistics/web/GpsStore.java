package com.example.logistics.web;

import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class GpsStore {

    private final ConcurrentHashMap<Long, GpsPosition> positions = new ConcurrentHashMap<>();

    public void update(Long employeeId, double lat, double lng) {
        positions.put(employeeId, new GpsPosition(employeeId, lat, lng));
    }

    public Collection<GpsPosition> getAll() {
        return positions.values();
    }

    public record GpsPosition(Long employeeId, double lat, double lng) {}
}
