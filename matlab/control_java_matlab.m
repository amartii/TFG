function control_java_matlab(outputFile)
% Control independiente, sintetico y sin toolbox. No escribe en matlab/output.
arguments
    outputFile (1,1) string
end
radius = 6371000;
lat0 = 0;
lon0 = 0;
lat1 = rad2deg(1000 / radius);
distance = 2 * radius * atan2(sqrt(sin(deg2rad(lat1-lat0)/2)^2), ...
    sqrt(1-sin(deg2rad(lat1-lat0)/2)^2));
frequency = 3.5e9;
wavelength = 299792458 / frequency;
fspl = 20*log10(distance) + 20*log10(frequency) ...
    + 20*log10(4*pi/299792458);
offset = 10*log10(66*12);
intervals = ceil(distance / 30);
x = linspace(0, distance, intervals+1);
flat = zeros(size(x));
ridge = max(0, 60*(1-abs(x/distance-0.5)/0.15));
values = zeros(1,2);
losses = zeros(1,2);
profiles = {flat, ridge};
for k = 1:2
    h = profiles{k} + x.*(distance-x)/(2*(4/3)*radius);
    h(1) = profiles{k}(1)+30;
    h(end) = profiles{k}(end)+30;
    losses(k) = deygout(x,h,wavelength);
    values(k) = max(-140, min(-40, 53-fspl-losses(k)-offset));
end
assert(abs(distance-1000) < 1e-8);
assert(abs(values(1)-(-79.316396)) < 1e-6);
assert(losses(1) == 0 && losses(2) > 0);
result = struct('distance_m',distance,'fspl_db',fspl,'resource_offset_db',offset, ...
    'flat_dbm',values(1),'ridge_dbm',values(2),'ridge_loss_db',losses(2));
fid = fopen(outputFile,'w');
assert(fid >= 0, 'No se puede crear el resultado de control.');
cleanup = onCleanup(@() fclose(fid));
fprintf(fid,'%s\n',jsonencode(result));
fprintf('Control sintetico: distancia=%.9f m, FSPL=%.9f dB, recurso=%.9f dB, plano=%.9f dBm, cresta=%.9f dBm, difraccion=%.9f dB\n', ...
    distance,fspl,offset,values(1),values(2),losses(2));
end

function loss = deygout(x,h,wavelength)
pending = [1 numel(x)];
loss = 0;
while ~isempty(pending)
    a = pending(end,1); b = pending(end,2); pending(end,:) = [];
    if b-a < 2, continue; end
    i = (a+1):(b-1);
    d1 = x(i)-x(a); d2 = x(b)-x(i);
    line = h(a)+(h(b)-h(a))*d1/(x(b)-x(a));
    v = (h(i)-line).*sqrt(2*(d1+d2)./(wavelength*d1.*d2));
    [maximum, index] = max(v);
    if maximum <= -0.78, continue; end
    shifted = maximum-0.1;
    loss = loss + 6.9 + 20*log10(sqrt(shifted^2+1)+shifted);
    dominant = i(index);
    pending = [pending; a dominant; dominant b]; %#ok<AGROW>
end
end
